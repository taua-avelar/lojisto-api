import { IsBoolean, IsOptional } from 'class-validator';

export class CancelInstallmentDto {
  @IsBoolean()
  @IsOptional()
  redistributeToNext?: boolean;
}
