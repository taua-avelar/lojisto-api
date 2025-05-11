import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CreditSalesService } from './credit-sales.service';
import { CreditSalesController } from './credit-sales.controller';
import { CreditSalesScheduler } from './credit-sales.scheduler';
import { CreditSale } from './entities/credit-sale.entity';
import { CreditInstallment } from './entities/credit-installment.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Store } from '../stores/entities/store.entity';
import { CommonModule } from '../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditSale, CreditInstallment, Sale, Customer, Store]),
    ScheduleModule.forRoot(),
    CommonModule,
    PermissionsModule,
  ],
  controllers: [CreditSalesController],
  providers: [CreditSalesService, CreditSalesScheduler],
  exports: [CreditSalesService]
})
export class CreditSalesModule {}
