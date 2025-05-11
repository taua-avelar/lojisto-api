import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/store-user-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const storeId = request.storeId;
    const storeUserRole = request.storeUserRole;

    if (!user || !storeId) {
      throw new UnauthorizedException('User or store ID not provided');
    }

    // If the user is an owner, they have all permissions
    if (storeUserRole === 'owner') {
      return true;
    }

    // Check if the user has any of the required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        user.id,
        storeId,
        permission,
      );

      if (hasPermission) {
        return true;
      }
    }

    throw new UnauthorizedException('Insufficient permissions');
  }
}
