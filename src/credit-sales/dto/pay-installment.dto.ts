import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { PaymentMethod } from '../entities/credit-installment.entity';

export class PayInstallmentDto {
  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
