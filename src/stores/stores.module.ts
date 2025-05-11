import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { StoreUser } from './entities/store-user.entity';
import { StoreConfig } from './entities/store-config.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, StoreUser, StoreConfig, User]),
    UsersModule,
    CommonModule,
    PermissionsModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
