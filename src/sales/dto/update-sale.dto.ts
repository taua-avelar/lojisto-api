import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDto } from './create-sale.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SaleStatus } from '../entities/sale.entity';

export class UpdateSaleDto extends PartialType(CreateSaleDto) {
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;
}
