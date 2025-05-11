import { IsEnum } from 'class-validator';
import { StoreRole } from '../entities/store-user.entity';

export class UpdateStoreUserRoleDto {
  @IsEnum(StoreRole)
  role: StoreRole;
}
