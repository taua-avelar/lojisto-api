import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus, PaymentMethod } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Store } from '../stores/entities/store.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private commissionsService: CommissionsService,
  ) {}

  async create(createSaleDto: CreateSaleDto, storeId: string): Promise<Sale> {
    // Verificar se a loja existe
    const store: Store | null = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Verificar se o cliente existe (se fornecido)
    let customer: Customer | null = null;
    if (createSaleDto.customerId) {
      customer = await this.customerRepository.findOne({
        where: { id: createSaleDto.customerId, store: { id: storeId } },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${createSaleDto.customerId} not found in store with ID ${storeId}`);
      }
    }

    // Verificar se o vendedor existe (se fornecido)
    let seller: User | null = null;
    if (createSaleDto.sellerId) {
      seller = await this.userRepository.findOne({
        where: { id: createSaleDto.sellerId },
        relations: ['storeUsers', 'storeUsers.store'],
      });

      if (!seller) {
        throw new NotFoundException(`User with ID ${createSaleDto.sellerId} not found`);
      }

      // Verificar se o usuário tem acesso à loja
      const hasAccess = seller.storeUsers.some(su => su.store.id === storeId);
      if (!hasAccess) {
        throw new BadRequestException(`User with ID ${createSaleDto.sellerId} does not have access to store with ID ${storeId}`);
      }
    }

    // Verificar se há itens na venda
    if (!createSaleDto.items || createSaleDto.items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // Iniciar uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar a venda
      const sale = new Sale();
      sale.store = store;
      sale.customer = customer;
      sale.seller = seller || null;

      // Definir o status da venda
      sale.status = createSaleDto.status || SaleStatus.COMPLETED; // Usar o status fornecido ou COMPLETED por padrão

      // Definir o método de pagamento
      // Para vendas pendentes, não definimos método de pagamento (será definido ao finalizar)
      if (sale.status === SaleStatus.PENDING) {
        // Não definir método de pagamento para vendas pendentes
        sale.paymentMethod = null;
      } else {
        // Para vendas não pendentes, o método de pagamento é obrigatório
        if (!createSaleDto.paymentMethod) {
          throw new BadRequestException('Payment method is required for non-pending sales');
        }
        sale.paymentMethod = createSaleDto.paymentMethod;
      }

      sale.date = new Date();
      sale.total = 0; // Será calculado com base nos itens

      // Salvar a venda para obter o ID
      const savedSale = await queryRunner.manager.save(sale);

      // Processar os itens da venda
      const saleItems: SaleItem[] = [];
      let total = 0;

      for (const itemDto of createSaleDto.items) {
        // Buscar o produto
        const product: Product | null = await this.productRepository.findOne({
          where: { id: itemDto.productId, store: { id: storeId } },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${itemDto.productId} not found in store with ID ${storeId}`);
        }

        // Verificar estoque
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${itemDto.quantity}`);
        }

        // Criar o item de venda
        const saleItem = new SaleItem();
        saleItem.sale = savedSale;
        saleItem.product = product;
        saleItem.quantity = itemDto.quantity;
        saleItem.originalPrice = product.price; // Preço original do produto
        
        // Usar o preço com desconto que vem do frontend, ou o preço original se não for fornecido
        const discountedPrice = itemDto.price || product.price;
        saleItem.price = discountedPrice;
        
        // Calcular o subtotal usando o preço com desconto
        saleItem.subtotal = discountedPrice * itemDto.quantity;

        // Adicionar ao total da venda
        total += saleItem.subtotal;

        // Atualizar o estoque do produto
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        // Salvar o item de venda
        const savedSaleItem = await queryRunner.manager.save(saleItem);
        saleItems.push(savedSaleItem);
      }

      // Atualizar o total da venda
      savedSale.total = total;
      savedSale.items = saleItems;
      await queryRunner.manager.save(savedSale);

      // Confirmar a transação
      await queryRunner.commitTransaction();

      // Buscar a venda completa com todas as relações
      const completeSale = await this.findOne(savedSale.id, storeId);

      // Criar comissão para o vendedor (se houver) após a transação ser confirmada
      try {
        if (completeSale.seller) {
          const commission = await this.commissionsService.createCommission(completeSale);
          console.log('Commission created:', commission ? commission.id : 'No commission created');
        }
      } catch (commissionError) {
        // Registrar o erro, mas não falhar a operação de venda
        console.error('Error creating commission:', commissionError);
      }

      return completeSale;
    } catch (error) {
      // Reverter a transação em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  async findAll(storeId: string): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { store: { id: storeId } },
      relations: ['customer', 'items', 'items.product', 'seller', 'store'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id, store: { id: storeId } },
      relations: ['customer', 'items', 'items.product', 'seller', 'store'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found in store with ID ${storeId}`);
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto, storeId: string): Promise<Sale> {
    // Buscar a venda
    const sale = await this.findOne(id, storeId);

    // Verificar se a venda pode ser atualizada
    if (sale.status === SaleStatus.CANCELED) {
      throw new BadRequestException('Cannot update a canceled sale');
    }

    // Atualizar o status da venda (se fornecido)
    if (updateSaleDto.status) {
      sale.status = updateSaleDto.status;
    }

    // Atualizar o método de pagamento (se fornecido)
    if (updateSaleDto.paymentMethod) {
      sale.paymentMethod = updateSaleDto.paymentMethod;
    }

    // Atualizar o cliente (se fornecido)
    if (updateSaleDto.customerId) {
      const customer: Customer | null = await this.customerRepository.findOne({
        where: { id: updateSaleDto.customerId, store: { id: storeId } },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${updateSaleDto.customerId} not found in store with ID ${storeId}`);
      }
      sale.customer = customer;
    }

    // Salvar as alterações
    return this.saleRepository.save(sale);
  }

  async remove(id: string, storeId: string): Promise<void> {
    // Buscar a venda
    const sale = await this.findOne(id, storeId);

    // Iniciar uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Se a venda não estiver cancelada, restaurar o estoque dos produtos
      if (sale.status !== SaleStatus.CANCELED) {
        for (const item of sale.items) {
          // Buscar o produto (se existir)
          if (item.product) {
            const product: Product | null = await this.productRepository.findOne({
              where: { id: item.product.id },
            });

            if (product) {
              // Restaurar o estoque
              product.stock += item.quantity;
              await queryRunner.manager.save(product);
            }
          }
        }
      }

      // Soft delete da venda (isso também aplicará soft delete aos itens devido à cascata)
      await queryRunner.manager.softRemove(sale);

      // Confirmar a transação
      await queryRunner.commitTransaction();
    } catch (error) {
      // Reverter a transação em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  async cancel(id: string, storeId: string): Promise<Sale> {
    // Buscar a venda
    const sale = await this.findOne(id, storeId);

    // Verificar se a venda já está cancelada
    if (sale.status === SaleStatus.CANCELED) {
      throw new BadRequestException('Sale is already canceled');
    }

    // Iniciar uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Restaurar o estoque dos produtos
      for (const item of sale.items) {
        // Buscar o produto (se existir)
        if (item.product) {
          const product: Product | null = await this.productRepository.findOne({
            where: { id: item.product.id },
          });

          if (product) {
            // Restaurar o estoque
            product.stock += item.quantity;
            await queryRunner.manager.save(product);
          }
        }
      }

      // Atualizar o status da venda
      sale.status = SaleStatus.CANCELED;
      await queryRunner.manager.save(sale);

      // Confirmar a transação
      await queryRunner.commitTransaction();

      // Cancelar a comissão associada à venda (se houver) após a transação ser confirmada
      try {
        await this.commissionsService.cancelCommission(id, storeId);
      } catch (commissionError) {
        // Registrar o erro, mas não falhar a operação de cancelamento da venda
        console.error('Error canceling commission:', commissionError);
      }

      return sale;
    } catch (error) {
      // Reverter a transação em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  // Métodos para estatísticas
  async getSalesStats(storeId: string): Promise<any> {
    // Obter todas as vendas da loja
    const sales = await this.saleRepository.find({
      where: { store: { id: storeId }, status: SaleStatus.COMPLETED },
    });

    // Calcular estatísticas
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCount = sales.length;
    const averageTicket = totalCount > 0 ? totalSales / totalCount : 0;

    // Obter vendas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= today;
    });
    const todayTotal = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Obter vendas de ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= yesterday && saleDate < today;
    });
    const yesterdayTotal = yesterdaySales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Calcular variação percentual
    const todayVsYesterday = yesterdayTotal > 0
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
      : 0;

    return {
      totalSales,
      totalCount,
      averageTicket,
      todayTotal,
      todayCount: todaySales.length,
      yesterdayTotal,
      yesterdayCount: yesterdaySales.length,
      todayVsYesterday,
    };
  }
}
