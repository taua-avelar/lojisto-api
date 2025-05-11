import { IsNumber, IsString, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class UpdateCommissionConfigDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  rate?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
