import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CreditSaleStatus } from '../entities/credit-sale.entity';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditSaleDto } from './create-credit-sale.dto';

export class UpdateCreditSaleDto extends PartialType(CreateCreditSaleDto) {
  @IsEnum(CreditSaleStatus)
  @IsOptional()
  status?: CreditSaleStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
