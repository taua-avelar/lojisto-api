import { IsNumber, IsOptional, Min } from 'class-validator';

export class StoreConfigDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  lowStockThreshold?: number;
}

export class UpdateStoreConfigDto extends StoreConfigDto {}
