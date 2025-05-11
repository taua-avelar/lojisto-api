import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StoreUser } from '../../stores/entities/store-user.entity';

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const storeId = request.headers['store-id'];

    if (!user || !storeId) {
      throw new UnauthorizedException('User or store ID not provided');
    }

    // Check if the user has access to the store
    const storeUserRepository = this.dataSource.getRepository(StoreUser);
    const storeUser = await storeUserRepository.findOne({
      where: {
        user: { id: user.id },
        store: { id: storeId }
      },
      relations: ['user', 'store'],
    });

    if (!storeUser) {
      throw new UnauthorizedException('User does not have access to this store');
    }

    // Add the store ID to the request for use in controllers
    request.storeId = storeId;

    // Add the store user role to the request for use in controllers
    request.storeUserRole = storeUser.role;

    return true;
  }
}
