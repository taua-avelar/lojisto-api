import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUserPermission } from './entities/store-user-permission.entity';
import { PermissionsService } from './services/permissions.service';
import { StoreUser } from '../stores/entities/store-user.entity';
import { StoreAccessGuard } from './guards/store-access.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreUserPermission, StoreUser]),
  ],
  providers: [PermissionsService, StoreAccessGuard, PermissionsGuard],
  exports: [PermissionsService, StoreAccessGuard, PermissionsGuard],
})
export class CommonModule {}
