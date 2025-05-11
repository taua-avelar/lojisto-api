import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { Commission } from './entities/commission.entity';
import { CommissionConfig } from './entities/commission-config.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { Sale } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commission, CommissionConfig, Store, StoreUser, Sale, User]),
    CommonModule,
    PermissionsModule,
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
