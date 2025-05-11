import { IsEnum } from 'class-validator';
import { CommissionStatus } from '../entities/commission.entity';

export class UpdateCommissionStatusDto {
  @IsEnum(CommissionStatus)
  status: CommissionStatus;
}
