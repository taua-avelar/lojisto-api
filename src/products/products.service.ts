import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, storeId: string): Promise<Product> {
    // Buscar a loja
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Criar o produto com os dados básicos
    const product = this.productRepository.create({
      ...createProductDto,
      store,
    });

    // Verificar se há uma categoria especificada
    if (createProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: createProductDto.categoryId,
          store: { id: storeId } // Garantir que a categoria pertence à mesma loja
        }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found in store with ID ${storeId}`);
      }

      // Associar a categoria ao produto
      product.category = category;
    }

    return this.productRepository.save(product);
  }

  async findAll(storeId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { store: { id: storeId } },
      order: { createdAt: 'DESC' },
      relations: ['category'], // Incluir a categoria relacionada
    });
  }

  async findOne(id: string, storeId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, store: { id: storeId } },
      relations: ['category'], // Incluir a categoria relacionada
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found in store with ID ${storeId}`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, storeId: string): Promise<Product> {
    // Buscar o produto
    const product = await this.findOne(id, storeId);

    // Verificar se há uma categoria especificada
    if (updateProductDto.categoryId !== undefined) {
      if (updateProductDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: {
            id: updateProductDto.categoryId,
            store: { id: storeId } // Garantir que a categoria pertence à mesma loja
          }
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found in store with ID ${storeId}`);
        }

        // Associar a categoria ao produto
        product.category = category;
      } else {
        // Se categoryId for null ou string vazia, remover a categoria
        // Usar uma query direta para atualizar o banco de dados
        await this.productRepository.query(
          `UPDATE products SET "category_id" = NULL WHERE id = $1`,
          [product.id]
        );
        // Atualizar o objeto em memória para refletir a mudança
        product.category = null as any;
      }
    }

    // Criar uma cópia sanitizada do DTO para evitar valores nulos em campos obrigatórios
    const sanitizedUpdateDto = { ...updateProductDto };

    // Garantir que price nunca seja null (é um campo obrigatório)
    if (sanitizedUpdateDto.price === null || sanitizedUpdateDto.price === undefined) {
      // Se price estiver sendo explicitamente definido como null, remover do objeto de atualização
      // para manter o valor atual do produto
      delete sanitizedUpdateDto.price;
    }

    // Garantir que cost nunca seja null (tem um valor padrão de 0)
    if (sanitizedUpdateDto.cost === null || sanitizedUpdateDto.cost === undefined) {
      // Se cost estiver sendo explicitamente definido como null, remover do objeto de atualização
      // para manter o valor atual do produto ou usar o valor padrão
      delete sanitizedUpdateDto.cost;
    }

    // Atualizar o produto com os valores sanitizados
    Object.assign(product, sanitizedUpdateDto);

    // Verificação final para garantir que price nunca seja null antes de salvar
    if (product.price === null || product.price === undefined) {
      throw new Error('Product price cannot be null or undefined');
    }

    return this.productRepository.save(product);
  }

  async remove(id: string, storeId: string): Promise<void> {
    // Buscar o produto
    const product = await this.findOne(id, storeId);

    // Soft delete do produto
    await this.productRepository.softRemove(product);
  }
}
