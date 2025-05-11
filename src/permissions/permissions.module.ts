import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from '../common/services/permissions.service';
import { StoreUserPermission } from '../common/entities/store-user-permission.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { Store } from '../stores/entities/store.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreUserPermission, StoreUser, Store]),
    CommonModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
