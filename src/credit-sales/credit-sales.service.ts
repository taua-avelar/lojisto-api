import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, Between } from 'typeorm';
import { CreditSale, CreditSaleStatus } from './entities/credit-sale.entity';
import { CreditInstallment, InstallmentStatus } from './entities/credit-installment.entity';
import { CreateCreditSaleDto } from './dto/create-credit-sale.dto';
import { UpdateCreditSaleDto } from './dto/update-credit-sale.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { CancelInstallmentDto } from './dto/cancel-installment.dto';
import { UpdateInstallmentDueDateDto } from './dto/update-installment-due-date.dto';
import { Store } from '../stores/entities/store.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class CreditSalesService {
  constructor(
    @InjectRepository(CreditSale)
    private creditSaleRepository: Repository<CreditSale>,
    @InjectRepository(CreditInstallment)
    private creditInstallmentRepository: Repository<CreditInstallment>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    private dataSource: DataSource
  ) {}

  async create(storeId: string, createCreditSaleDto: CreateCreditSaleDto): Promise<CreditSale> {
    const { customerId, saleId, totalAmount, downPayment = 0, installments, firstDueDate, daysInterval = 30, notes } = createCreditSaleDto;

    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o cliente existe
    const customer = await this.customerRepository.findOne({ where: { id: customerId, store: { id: storeId } } });
    if (!customer) {
      throw new NotFoundException(`Cliente com ID ${customerId} não encontrado na loja ${storeId}`);
    }

    // Verificar se a venda existe (obrigatória agora)
    if (!saleId) {
      throw new BadRequestException('O ID da venda é obrigatório para criar um crediário');
    }

    const sale = await this.saleRepository.findOne({ where: { id: saleId, store: { id: storeId } } });
    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada na loja ${storeId}`);
    }

    // Validar o número de parcelas
    if (installments <= 0) {
      throw new BadRequestException('O número de parcelas deve ser maior que zero');
    }

    // Validar o valor total
    if (totalAmount <= 0) {
      throw new BadRequestException('O valor total deve ser maior que zero');
    }

    // Validar o valor da entrada
    if (downPayment < 0) {
      throw new BadRequestException('O valor da entrada não pode ser negativo');
    }

    if (downPayment >= totalAmount) {
      throw new BadRequestException('O valor da entrada não pode ser maior ou igual ao valor total');
    }

    // Calcular o valor a ser parcelado (total - entrada)
    const amountToInstall = totalAmount - downPayment;

    // Calcular o valor de cada parcela
    const installmentAmount = Number((amountToInstall / installments).toFixed(2));
    const remainder = Number((amountToInstall - (installmentAmount * installments)).toFixed(2));

    // Criar o crediário e as parcelas em uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar o crediário
      const creditSale = new CreditSale();
      creditSale.store = store;
      creditSale.customer = customer;
      creditSale.sale = sale;
      creditSale.total_amount = totalAmount;
      creditSale.down_payment = downPayment;
      creditSale.paid_amount = downPayment; // A entrada já é considerada como paga
      creditSale.remaining_amount = amountToInstall;
      creditSale.installments = installments;
      creditSale.status = CreditSaleStatus.ACTIVE;
      creditSale.notes = notes || null;

      const savedCreditSale = await queryRunner.manager.save(creditSale);

      // Criar as parcelas
      const installmentsList: CreditInstallment[] = [];
      const firstDueDateObj = new Date(firstDueDate);

      for (let i = 0; i < installments; i++) {
        const installment = new CreditInstallment();
        installment.creditSale = savedCreditSale;
        installment.number = i + 1;

        // Adicionar o remainder à primeira parcela
        if (i === 0) {
          installment.amount = installmentAmount + remainder;
        } else {
          installment.amount = installmentAmount;
        }

        // Calcular a data de vencimento
        if (i === 0) {
          // A primeira parcela mantém a data de vencimento original
          installment.due_date = new Date(firstDueDateObj);
        } else {
          // Para as demais parcelas, adicionar o intervalo em dias
          // Criar uma nova data para cada parcela para evitar referências compartilhadas
          const dueDate = new Date(firstDueDateObj);
          dueDate.setDate(dueDate.getDate() + (i * daysInterval));
          installment.due_date = dueDate;
        }

        installment.status = InstallmentStatus.PENDING;

        installmentsList.push(installment);
      }

      await queryRunner.manager.save(installmentsList);

      // Commit da transação
      await queryRunner.commitTransaction();

      // Carregar o crediário com as parcelas
      const result = await this.findOne(storeId, savedCreditSale.id);
      return result;
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  // Fim do método create

  async findAll(storeId: string): Promise<CreditSale[]> {
    return this.creditSaleRepository.find({
      where: { store: { id: storeId } },
      relations: ['customer', 'store', 'sale', 'installmentsList'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(storeId: string, id: string): Promise<CreditSale> {
    const creditSale = await this.creditSaleRepository.findOne({
      where: { id, store: { id: storeId } },
      relations: ['customer', 'store', 'sale', 'installmentsList'],
    });

    if (!creditSale) {
      throw new NotFoundException(`Crediário com ID ${id} não encontrado na loja ${storeId}`);
    }

    return creditSale;
  }

  async findByCustomer(storeId: string, customerId: string): Promise<CreditSale[]> {
    return this.creditSaleRepository.find({
      where: { store: { id: storeId }, customer: { id: customerId } },
      relations: ['customer', 'store', 'sale', 'installmentsList'],
      order: { created_at: 'DESC' }
    });
  }

  async update(storeId: string, id: string, updateCreditSaleDto: UpdateCreditSaleDto): Promise<CreditSale> {
    const creditSale = await this.findOne(storeId, id);

    // Não permitir alterações em crediários cancelados
    if (creditSale.status === CreditSaleStatus.CANCELED) {
      throw new BadRequestException('Não é possível alterar um crediário cancelado');
    }

    // Atualizar apenas os campos permitidos
    if (updateCreditSaleDto.status) {
      creditSale.status = updateCreditSaleDto.status;
    }

    if (updateCreditSaleDto.notes !== undefined) {
      creditSale.notes = updateCreditSaleDto.notes;
    }

    // Se o status for alterado para COMPLETED, verificar se todas as parcelas foram pagas
    if (updateCreditSaleDto.status === CreditSaleStatus.COMPLETED) {
      const pendingInstallments = creditSale.installmentsList.filter(
        installment => installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.OVERDUE
      );

      if (pendingInstallments.length > 0) {
        throw new BadRequestException('Não é possível marcar o crediário como concluído enquanto houver parcelas pendentes ou vencidas');
      }
    }

    // Se o status for alterado para CANCELED, cancelar todas as parcelas pendentes
    if (updateCreditSaleDto.status === CreditSaleStatus.CANCELED) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Cancelar parcelas pendentes
        const pendingInstallments = creditSale.installmentsList.filter(
          installment => installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.OVERDUE
        );

        for (const installment of pendingInstallments) {
          installment.status = InstallmentStatus.CANCELED;
          await queryRunner.manager.save(installment);
        }

        // Atualizar o crediário
        creditSale.status = CreditSaleStatus.CANCELED;
        await queryRunner.manager.save(creditSale);

        // Commit da transação
        await queryRunner.commitTransaction();
      } catch (error) {
        // Rollback em caso de erro
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Liberar o queryRunner
        await queryRunner.release();
      }

      return this.findOne(storeId, id);
    }

    return this.creditSaleRepository.save(creditSale);
  }

  async remove(storeId: string, id: string): Promise<void> {
    const creditSale = await this.findOne(storeId, id);

    // Verificar se há parcelas pagas
    const paidInstallments = creditSale.installmentsList.filter(
      installment => installment.status === InstallmentStatus.PAID
    );

    if (paidInstallments.length > 0) {
      throw new BadRequestException('Não é possível excluir um crediário que possui parcelas pagas');
    }

    // Usar soft delete em vez de remoção física
    await this.creditSaleRepository.softRemove(creditSale);
  }

  async findInstallments(storeId: string, creditSaleId: string): Promise<CreditInstallment[]> {
    // Verificar se o crediário existe
    const creditSale = await this.findOne(storeId, creditSaleId);

    // Ordenar as parcelas por número
    return creditSale.installmentsList.sort((a, b) => a.number - b.number);
  }

  async payInstallment(storeId: string, creditSaleId: string, installmentId: string, payInstallmentDto: PayInstallmentDto): Promise<CreditInstallment> {
    const { paymentDate, paymentMethod, notes, amount } = payInstallmentDto;

    // Verificar se o crediário existe
    const creditSale = await this.findOne(storeId, creditSaleId);

    // Verificar se o crediário está ativo
    if (creditSale.status !== CreditSaleStatus.ACTIVE) {
      throw new BadRequestException(`Não é possível pagar parcelas de um crediário ${creditSale.status.toLowerCase()}`);
    }

    // Verificar se a parcela existe
    const installment = creditSale.installmentsList.find(i => i.id === installmentId);
    if (!installment) {
      throw new NotFoundException(`Parcela com ID ${installmentId} não encontrada no crediário ${creditSaleId}`);
    }

    // Verificar se a parcela já foi paga ou cancelada
    if (installment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Esta parcela já foi paga');
    }

    if (installment.status === InstallmentStatus.CANCELED) {
      throw new BadRequestException('Não é possível pagar uma parcela cancelada');
    }

    // Verificar se é a parcela mais antiga pendente
    const pendingInstallments = creditSale.installmentsList
      .filter(i => i.status === InstallmentStatus.PENDING || i.status === InstallmentStatus.OVERDUE)
      .sort((a, b) => a.number - b.number);

    if (pendingInstallments.length > 0 && pendingInstallments[0].id !== installmentId) {
      throw new BadRequestException('É necessário pagar as parcelas na ordem. Por favor, pague a parcela mais antiga primeiro.');
    }

    // Iniciar transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determinar o valor do pagamento
      let paymentAmount = amount !== undefined ? Number(amount) : Number(installment.amount);

      // Verificar se o valor do pagamento é válido
      if (paymentAmount <= 0) {
        throw new BadRequestException('O valor do pagamento deve ser maior que zero');
      }

      // Limitar o pagamento ao valor restante do crediário
      paymentAmount = Math.min(paymentAmount, Number(creditSale.remaining_amount));

      // Se o valor do pagamento for menor que o valor da parcela, é um pagamento parcial
      const isPartialPayment = paymentAmount < Number(installment.amount);

      // Se o valor do pagamento for maior que o valor da parcela, é um pagamento excedente
      const isExcessPayment = paymentAmount > Number(installment.amount);

      // Atualizar a parcela atual
      installment.payment_date = new Date(paymentDate);
      installment.payment_method = paymentMethod;

      // Adicionar notas fornecidas pelo usuário
      let installmentNotes = notes || '';

      if (isPartialPayment) {
        // Pagamento parcial: atualizar o valor da parcela e adicionar o restante à próxima
        const paidAmount = paymentAmount;
        const remainingAmount = Number((Number(installment.amount) - paidAmount).toFixed(2));

        // Adicionar nota sobre pagamento parcial
        if (installmentNotes) {
          installmentNotes += ' | ';
        }
        installmentNotes += `Pagamento parcial de ${paidAmount.toFixed(2)}. Valor restante de ${remainingAmount.toFixed(2)} transferido para a próxima parcela.`;

        // Atualizar o valor da parcela para o valor efetivamente pago
        installment.amount = Number(paidAmount.toFixed(2));

        // Marcar a parcela atual como paga
        installment.status = InstallmentStatus.PAID;
        installment.notes = installmentNotes;

        // Encontrar a próxima parcela pendente
        const nextPendingInstallments = creditSale.installmentsList
          .filter(i => (i.status === InstallmentStatus.PENDING || i.status === InstallmentStatus.OVERDUE) && i.id !== installmentId)
          .sort((a, b) => a.number - b.number);

        if (nextPendingInstallments.length > 0) {
          // Adicionar o valor restante à próxima parcela
          const nextInstallment = nextPendingInstallments[0];
          nextInstallment.amount = Number((Number(nextInstallment.amount) + remainingAmount).toFixed(2));
          await queryRunner.manager.save(nextInstallment);
        }
      } else if (isExcessPayment) {
        // Pagamento excedente: pagar a parcela atual e usar o excesso para pagar as próximas
        let excessAmount = Number((paymentAmount - Number(installment.amount)).toFixed(2));

        // Adicionar nota sobre pagamento excedente
        if (installmentNotes) {
          installmentNotes += ' | ';
        }
        installmentNotes += `Pagamento total com excedente de ${excessAmount.toFixed(2)} aplicado às próximas parcelas.`;

        // Marcar a parcela atual como paga (mantendo seu valor original)
        installment.status = InstallmentStatus.PAID;
        installment.notes = installmentNotes;

        // Processar o pagamento excedente para as próximas parcelas
        if (excessAmount > 0) {
          // Ordenar as parcelas pendentes por número
          const pendingInstallments = creditSale.installmentsList
            .filter(i => (i.status === InstallmentStatus.PENDING || i.status === InstallmentStatus.OVERDUE) && i.id !== installmentId)
            .sort((a, b) => a.number - b.number);

          // Pagar parcelas completas enquanto houver excesso suficiente
          for (let i = 0; i < pendingInstallments.length; i++) {
            if (excessAmount <= 0) break;

            const nextInstallment = pendingInstallments[i];
            const nextInstallmentAmount = Number(nextInstallment.amount);

            if (excessAmount >= nextInstallmentAmount) {
              // Pagar a parcela completamente (mantendo seu valor original)
              nextInstallment.status = InstallmentStatus.PAID;
              nextInstallment.payment_date = new Date(paymentDate);
              nextInstallment.payment_method = paymentMethod;
              nextInstallment.notes = 'Pago automaticamente com valor excedente da parcela anterior.';

              // Reduzir o valor excedente pelo valor da parcela
              excessAmount = Number((excessAmount - nextInstallmentAmount).toFixed(2));
              await queryRunner.manager.save(nextInstallment);
            } else {
              // Quando o excedente não cobre uma parcela completa, reduzir o valor dessa parcela
              const originalNextAmount = nextInstallmentAmount;
              const newAmount = Number((nextInstallmentAmount - excessAmount).toFixed(2));
              nextInstallment.amount = newAmount;
              nextInstallment.notes = `Valor reduzido de ${originalNextAmount.toFixed(2)} para ${newAmount.toFixed(2)} devido a pagamento excedente da parcela anterior.`;

              // Adicionar o valor descontado à última parcela paga completamente
              // para manter a coerência na soma dos valores das parcelas
              const valueToAdd = excessAmount;

              // Encontrar a última parcela paga completamente
              // Primeiro, obter todas as parcelas pagas nesta operação (incluindo a original)
              const paidInstallments = [installment, ...pendingInstallments.slice(0, i)];

              // Ordenar por número de parcela (decrescente) para pegar a última
              paidInstallments.sort((a, b) => b.number - a.number);

              // A última parcela paga completamente será a primeira da lista ordenada
              const lastFullyPaidInstallment = paidInstallments[0];

              // Adicionar o valor à última parcela paga completamente
              const originalLastAmount = Number(lastFullyPaidInstallment.amount);
              lastFullyPaidInstallment.amount = Number((originalLastAmount + valueToAdd).toFixed(2));

              // Atualizar a nota da parcela
              if (!lastFullyPaidInstallment.notes.includes('Valor ajustado')) {
                lastFullyPaidInstallment.notes += ` | Valor ajustado: adicionado ${valueToAdd.toFixed(2)} para manter coerência com o valor total.`;
              }

              await queryRunner.manager.save(lastFullyPaidInstallment);

              excessAmount = 0;
              await queryRunner.manager.save(nextInstallment);
              break;
            }
          }
        }
      } else {
        // Pagamento exato: simplesmente marcar a parcela como paga
        installment.status = InstallmentStatus.PAID;
        installment.notes = installmentNotes || '';
      }

      // Salvar a parcela atualizada
      await queryRunner.manager.save(installment);

      // Atualizar o valor pago do crediário
      creditSale.paid_amount = Number((Number(creditSale.paid_amount) + paymentAmount).toFixed(2));

      // Garantir que o valor pago não exceda o valor total
      if (creditSale.paid_amount > creditSale.total_amount) {
        creditSale.paid_amount = creditSale.total_amount;
      }

      // Recalcular o valor restante (total - pago)
      creditSale.remaining_amount = Number((creditSale.total_amount - creditSale.paid_amount).toFixed(2));

      // Garantir que o valor restante não seja negativo
      if (creditSale.remaining_amount < 0) {
        creditSale.remaining_amount = 0;
      }

      // Verificar se todas as parcelas foram pagas
      const allPaid = creditSale.installmentsList.every(
        i => i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.CANCELED
      );

      // Se todas as parcelas foram pagas, marcar o crediário como concluído
      if (allPaid) {
        creditSale.status = CreditSaleStatus.COMPLETED;
      }

      // Salvar as alterações no crediário
      await queryRunner.manager.save(creditSale);

      // Commit da transação
      await queryRunner.commitTransaction();

      // Retornar a parcela atualizada
      return installment;
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  async cancelInstallment(storeId: string, creditSaleId: string, installmentId: string, cancelInstallmentDto?: CancelInstallmentDto): Promise<CreditInstallment> {
    // Definir o valor padrão para redistributeToNext (false = redistribuir entre todas as parcelas)
    const redistributeToNext = cancelInstallmentDto?.redistributeToNext || false;
    // Verificar se o crediário existe
    const creditSale = await this.findOne(storeId, creditSaleId);

    // Verificar se a parcela existe
    const installment = creditSale.installmentsList.find(i => i.id === installmentId);
    if (!installment) {
      throw new NotFoundException(`Parcela com ID ${installmentId} não encontrada no crediário ${creditSaleId}`);
    }

    // Verificar se a parcela já foi paga ou cancelada
    if (installment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Não é possível cancelar uma parcela já paga');
    }

    if (installment.status === InstallmentStatus.CANCELED) {
      throw new BadRequestException('Esta parcela já foi cancelada');
    }

    // Verificar se o crediário está ativo
    if (creditSale.status !== CreditSaleStatus.ACTIVE) {
      throw new BadRequestException(`Não é possível cancelar parcelas de um crediário ${creditSale.status.toLowerCase()}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Guardar o valor da parcela que será cancelada
      const canceledAmount = Number(installment.amount);

      // Atualizar a parcela
      installment.status = InstallmentStatus.CANCELED;
      await queryRunner.manager.save(installment);

      // Recalcular o valor total do crediário (soma das parcelas não canceladas)
      const activeInstallments = creditSale.installmentsList.filter(
        i => i.status !== InstallmentStatus.CANCELED
      );

      // Calcular o novo valor total (soma das parcelas ativas + entrada)
      // Garantir que down_payment seja um número
      let newTotalAmount = Number(creditSale.down_payment || 0);

      // Log para depuração
      console.log('Valor inicial (entrada):', newTotalAmount, 'tipo:', typeof newTotalAmount);

      // Somar os valores das parcelas ativas, garantindo que sejam números
      activeInstallments.forEach(i => {
        const installmentAmount = Number(i.amount || 0);
        console.log('Parcela:', i.number, 'valor:', installmentAmount, 'tipo:', typeof installmentAmount);
        newTotalAmount += installmentAmount;
      });

      console.log('Valor total antes de arredondar:', newTotalAmount, 'tipo:', typeof newTotalAmount);

      // Arredondar para 2 casas decimais, garantindo que seja um número
      newTotalAmount = Number((Math.round(newTotalAmount * 100) / 100).toFixed(2));

      // Atualizar o valor total do crediário
      creditSale.total_amount = newTotalAmount;

      // Garantir que paid_amount seja um número
      const paidAmount = Number(creditSale.paid_amount || 0);
      console.log('Valor pago:', paidAmount, 'tipo:', typeof paidAmount);

      // Recalcular o valor restante (total - pago)
      const remainingAmount = Math.max(0, newTotalAmount - paidAmount);
      console.log('Valor restante calculado:', remainingAmount);

      // Arredondar para 2 casas decimais
      creditSale.remaining_amount = Number((Math.round(remainingAmount * 100) / 100).toFixed(2));
      console.log('Valor restante arredondado:', creditSale.remaining_amount);

      // Verificar se há parcelas pendentes para redistribuir o valor
      const pendingInstallments = creditSale.installmentsList.filter(
        i => i.status === InstallmentStatus.PENDING || i.status === InstallmentStatus.OVERDUE
      );

      console.log('Número de parcelas pendentes:', pendingInstallments.length);
      console.log('Valor da parcela cancelada:', canceledAmount);

      if (pendingInstallments.length > 0) {
        try {
          // Ordenar as parcelas por número
          pendingInstallments.sort((a, b) => a.number - b.number);

          console.log('Modo de redistribuição:', redistributeToNext ? 'Para próxima parcela' : 'Entre todas as parcelas');

          if (redistributeToNext) {
            // Modo: Adicionar todo o valor à próxima parcela
            const nextInstallment = pendingInstallments[0];
            console.log('Próxima parcela:', nextInstallment.number);

            // Garantir que o valor atual da parcela seja um número
            const currentAmount = Number(nextInstallment.amount || 0);
            console.log('Valor atual da próxima parcela:', currentAmount);

            // Adicionar todo o valor cancelado à próxima parcela
            const newAmount = currentAmount + canceledAmount;
            console.log('Novo valor calculado para próxima parcela:', newAmount);

            // Arredondar para 2 casas decimais
            nextInstallment.amount = Math.round(newAmount * 100) / 100;
            console.log('Novo valor arredondado para próxima parcela:', nextInstallment.amount);

            await queryRunner.manager.save(nextInstallment);
          } else {
            // Modo: Redistribuir o valor entre todas as parcelas pendentes
            const valuePerInstallment = Number(canceledAmount) / pendingInstallments.length;
            console.log('Valor por parcela (antes de arredondar):', valuePerInstallment);

            // Arredondar para 2 casas decimais
            const roundedValuePerInstallment = Math.round(valuePerInstallment * 100) / 100;
            console.log('Valor por parcela (arredondado):', roundedValuePerInstallment);

            // Calcular o resto da divisão para adicionar ao último valor
            const totalDistributed = roundedValuePerInstallment * pendingInstallments.length;
            const remainder = Math.round((canceledAmount - totalDistributed) * 100) / 100;
            console.log('Resto da divisão:', remainder);

            // Distribuir o valor igualmente entre as parcelas pendentes
            for (let i = 0; i < pendingInstallments.length; i++) {
              const pendingInstallment = pendingInstallments[i];
              console.log('Processando parcela:', pendingInstallment.number);

              // Adicionar o valor proporcional à parcela
              let additionalValue = roundedValuePerInstallment;

              // Adicionar o resto à última parcela
              if (i === pendingInstallments.length - 1 && remainder !== 0) {
                additionalValue += remainder;
                console.log('Adicionando resto à última parcela:', remainder);
              }

              // Garantir que o valor atual da parcela seja um número
              const currentAmount = Number(pendingInstallment.amount || 0);
              console.log('Valor atual da parcela:', currentAmount);

              // Calcular o novo valor
              const newAmount = currentAmount + additionalValue;
              console.log('Novo valor calculado:', newAmount);

              // Arredondar para 2 casas decimais
              pendingInstallment.amount = Math.round(newAmount * 100) / 100;
              console.log('Novo valor arredondado:', pendingInstallment.amount);

              await queryRunner.manager.save(pendingInstallment);
            }
          }
        } catch (error) {
          console.error('Erro ao redistribuir valores:', error);
          throw error;
        }
      }

      // Verificar se todas as parcelas foram pagas ou canceladas
      const allPaidOrCanceled = creditSale.installmentsList.every(
        i => i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.CANCELED
      );

      // Recalcular o valor total do crediário com base nos valores atuais das parcelas
      let recalculatedTotalAmount = Number(creditSale.down_payment || 0);

      // Somar os valores de todas as parcelas não canceladas
      creditSale.installmentsList.forEach(inst => {
        if (inst.status !== InstallmentStatus.CANCELED) {
          recalculatedTotalAmount += Number(inst.amount || 0);
        }
      });

      // Atualizar o valor total do crediário
      creditSale.total_amount = Number(recalculatedTotalAmount.toFixed(2));
      console.log('Valor total recalculado com base nos valores atuais das parcelas:', creditSale.total_amount);

      // Recalcular o valor restante (total - pago)
      creditSale.remaining_amount = Number((creditSale.total_amount - creditSale.paid_amount).toFixed(2));

      // Garantir que o valor restante nunca seja negativo
      if (creditSale.remaining_amount < 0) {
        creditSale.remaining_amount = 0;
      }

      console.log('Valor restante recalculado:', creditSale.remaining_amount);

      // Verificar se o crediário deve ser marcado como concluído
      if (allPaidOrCanceled) {
        creditSale.status = CreditSaleStatus.COMPLETED;
        console.log('Crediário marcado como concluído.');
      }

      // Salvar as alterações no crediário
      await queryRunner.manager.save(creditSale);

      // Commit da transação
      await queryRunner.commitTransaction();

      return installment;
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }

  async findOverdueInstallments(storeId: string): Promise<CreditInstallment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.creditInstallmentRepository.find({
      where: {
        creditSale: { store: { id: storeId } },
        status: InstallmentStatus.PENDING,
        due_date: LessThan(today),
      },
      relations: ['creditSale', 'creditSale.customer'],
      order: { due_date: 'ASC' },
    });
  }

  async updateOverdueInstallments(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Atualizar parcelas vencidas
    await this.creditInstallmentRepository.update(
      {
        status: InstallmentStatus.PENDING,
        due_date: LessThan(today),
      },
      { status: InstallmentStatus.OVERDUE }
    );
  }

  async findUpcomingInstallments(storeId: string, limit: number = 10): Promise<CreditInstallment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular a data limite (hoje + 7 dias)
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    // Buscar parcelas pendentes com vencimento nos próximos 7 dias, ordenadas por data de vencimento
    return this.creditInstallmentRepository.find({
      where: {
        creditSale: { store: { id: storeId }, status: CreditSaleStatus.ACTIVE },
        status: InstallmentStatus.PENDING,
        due_date: Between(today, sevenDaysLater),
      },
      relations: ['creditSale', 'creditSale.customer'],
      order: { due_date: 'ASC' },
      take: limit,
    });
  }

  async updateInstallmentDueDate(
    storeId: string,
    creditSaleId: string,
    installmentId: string,
    updateInstallmentDueDateDto: UpdateInstallmentDueDateDto
  ): Promise<CreditInstallment> {
    const { dueDate, notes } = updateInstallmentDueDateDto;

    // Verificar se o crediário existe
    const creditSale = await this.findOne(storeId, creditSaleId);

    // Verificar se o crediário está ativo
    if (creditSale.status !== CreditSaleStatus.ACTIVE) {
      throw new BadRequestException(`Não é possível alterar parcelas de um crediário ${creditSale.status.toLowerCase()}`);
    }

    // Verificar se a parcela existe
    const installment = creditSale.installmentsList.find(i => i.id === installmentId);
    if (!installment) {
      throw new NotFoundException(`Parcela com ID ${installmentId} não encontrada no crediário ${creditSaleId}`);
    }

    // Verificar se a parcela já foi paga ou cancelada
    if (installment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Não é possível alterar a data de vencimento de uma parcela já paga');
    }

    if (installment.status === InstallmentStatus.CANCELED) {
      throw new BadRequestException('Não é possível alterar a data de vencimento de uma parcela cancelada');
    }

    // Iniciar transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Atualizar a data de vencimento da parcela
      installment.due_date = new Date(dueDate);

      // Adicionar notas se fornecidas
      if (notes) {
        if (installment.notes) {
          installment.notes += ` | ${notes}`;
        } else {
          installment.notes = notes;
        }
      }

      // Verificar se a parcela está vencida com base na nova data
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (installment.due_date < today && installment.status === InstallmentStatus.PENDING) {
        installment.status = InstallmentStatus.OVERDUE;
      } else if (installment.due_date >= today && installment.status === InstallmentStatus.OVERDUE) {
        installment.status = InstallmentStatus.PENDING;
      }

      // Salvar a parcela atualizada
      await queryRunner.manager.save(installment);

      // Commit da transação
      await queryRunner.commitTransaction();

      return installment;
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar o queryRunner
      await queryRunner.release();
    }
  }
}
