import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateInstallmentDueDateDto {
  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
