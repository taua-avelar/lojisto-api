import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreditSalesService } from './credit-sales.service';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { PaymentMethod } from './entities/credit-installment.entity';

async function testPayment() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const creditSalesService = app.get(CreditSalesService);

  // Configurações de teste
  const storeId = '592db081-7694-469f-bb8f-cc9e6d9f8fb7'; // ID da loja de exemplo
  const creditSaleId = 'ad5639e0-4ecd-4887-b00b-252ace244a00'; // ID do crediário de exemplo
  const installmentId = '4549c198-6419-4805-bf3f-45986f5d2c63'; // ID da parcela a ser paga

  try {
    // Buscar o crediário antes do pagamento
    console.log('Buscando crediário antes do pagamento...');
    const creditSaleBefore = await creditSalesService.findOne(storeId, creditSaleId);
    console.log('Crediário encontrado:');
    console.log(`ID: ${creditSaleBefore.id}`);
    console.log(`Valor total: ${creditSaleBefore.total_amount}`);
    console.log(`Valor pago: ${creditSaleBefore.paid_amount}`);
    console.log(`Valor restante: ${creditSaleBefore.remaining_amount}`);
    console.log('Parcelas:');
    
    // Ordenar parcelas por número
    const sortedInstallments = [...creditSaleBefore.installmentsList].sort((a, b) => a.number - b.number);
    
    sortedInstallments.forEach(installment => {
      console.log(`  Parcela ${installment.number}: ${installment.amount} - Status: ${installment.status}`);
    });

    // Criar o DTO de pagamento
    const paymentDto: PayInstallmentDto = {
      paymentDate: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
      paymentMethod: PaymentMethod.CASH,
      notes: 'Pagamento de teste',
      amount: 50 // Valor do pagamento (ajuste conforme necessário para testar diferentes cenários)
    };

    // Realizar o pagamento
    console.log('\nRealizando pagamento...');
    console.log(`Valor do pagamento: ${paymentDto.amount}`);
    const result = await creditSalesService.payInstallment(storeId, creditSaleId, installmentId, paymentDto);
    console.log('Pagamento realizado com sucesso!');
    console.log(`Parcela paga: ${result.number}`);
    console.log(`Valor pago: ${result.amount}`);
    console.log(`Status: ${result.status}`);

    // Buscar o crediário após o pagamento
    console.log('\nBuscando crediário após o pagamento...');
    const creditSaleAfter = await creditSalesService.findOne(storeId, creditSaleId);
    console.log('Crediário atualizado:');
    console.log(`ID: ${creditSaleAfter.id}`);
    console.log(`Valor total: ${creditSaleAfter.total_amount}`);
    console.log(`Valor pago: ${creditSaleAfter.paid_amount}`);
    console.log(`Valor restante: ${creditSaleAfter.remaining_amount}`);
    console.log('Parcelas:');
    
    // Ordenar parcelas por número
    const sortedInstallmentsAfter = [...creditSaleAfter.installmentsList].sort((a, b) => a.number - b.number);
    
    sortedInstallmentsAfter.forEach(installment => {
      console.log(`  Parcela ${installment.number}: ${installment.amount} - Status: ${installment.status}`);
    });

  } catch (error) {
    console.error('Erro ao testar o pagamento:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  } finally {
    await app.close();
  }
}

testPayment();
