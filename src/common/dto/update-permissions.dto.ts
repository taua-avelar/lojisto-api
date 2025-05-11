import { IsArray } from 'class-validator';
import { Permission } from '../entities/store-user-permission.entity';

export class UpdatePermissionsDto {
  @IsArray()
  permissions: Permission[];
}
