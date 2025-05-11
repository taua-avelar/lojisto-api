import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min, IsPositive, IsInt } from 'class-validator';

export class CreateCreditSaleDto {
  @IsUUID()
  @IsOptional()
  saleId?: string;

  @IsUUID()
  customerId: string;

  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  downPayment?: number;

  @IsInt()
  @Min(1)
  installments: number;

  @IsDateString()
  firstDueDate: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  daysInterval?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
