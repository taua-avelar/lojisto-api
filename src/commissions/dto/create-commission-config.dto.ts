import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateCommissionConfigDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsString()
  @IsOptional()
  description?: string;
}
