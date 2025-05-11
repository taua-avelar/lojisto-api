import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';
import { AddUserToStoreDto } from './dto/add-user-to-store.dto';
import { UpdateStoreUserRoleDto } from './dto/update-store-user-role.dto';
import { UpdateStoreUserCommissionsDto } from './dto/update-store-user-commissions.dto';
import { StoreConfigDto } from './dto/store-config.dto';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('user/me')
  findMyStores(@Request() req: any) {
    return this.storesService.findStoresByUser(req.user.userId);
  }

  // Rotas para gerenciar usuários da loja
  @Get(':storeId/users')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_STORE_USERS)
  findStoreUsers(@Param('storeId') storeId: string, @Request() req: any) {
    return this.storesService.findStoreUsers(storeId, req.user.userId);
  }

  @Post(':storeId/users')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STORE_USERS)
  addUserToStore(
    @Param('storeId') storeId: string,
    @Body() addUserDto: AddUserToStoreDto,
    @Request() req: any,
  ) {
    return this.storesService.addUserToStore(storeId, addUserDto, req.user.userId);
  }

  @Patch(':storeId/users/:storeUserId/role')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STORE_USERS)
  updateUserRole(
    @Param('storeId') storeId: string,
    @Param('storeUserId') storeUserId: string,
    @Body() updateRoleDto: UpdateStoreUserRoleDto,
    @Request() req: any,
  ) {
    return this.storesService.updateUserRole(storeId, storeUserId, updateRoleDto, req.user.userId);
  }

  @Patch(':storeId/users/:storeUserId/commissions')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STORE_USERS)
  updateUserCommissions(
    @Param('storeId') storeId: string,
    @Param('storeUserId') storeUserId: string,
    @Body() updateCommissionsDto: UpdateStoreUserCommissionsDto,
    @Request() req: any,
  ) {
    return this.storesService.updateUserCommissions(storeId, storeUserId, updateCommissionsDto, req.user.userId);
  }

  @Delete(':storeId/users/:storeUserId')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STORE_USERS)
  removeUserFromStore(
    @Param('storeId') storeId: string,
    @Param('storeUserId') storeUserId: string,
    @Request() req: any,
  ) {
    return this.storesService.removeUserFromStore(storeId, storeUserId, req.user.userId);
  }

  // Rotas para gerenciar configurações da loja
  @Get(':storeId/config')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_STORE_CONFIG)
  getStoreConfig(@Param('storeId') storeId: string) {
    return this.storesService.getStoreConfig(storeId);
  }

  @Patch(':storeId/config')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.EDIT_STORE_CONFIG)
  updateStoreConfig(
    @Param('storeId') storeId: string,
    @Body() configDto: StoreConfigDto,
    @Request() req: any,
  ) {
    return this.storesService.updateStoreConfig(storeId, configDto, req.user.userId);
  }
}
