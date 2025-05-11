import { SetMetadata } from '@nestjs/common';
import { Permission } from '../entities/store-user-permission.entity';

export const RequirePermissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);
