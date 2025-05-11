import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Request, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';
import { PermissionsService } from '../common/services/permissions.service';
import { UpdatePermissionsDto } from '../common/dto/update-permissions.dto';
import { StoreRole } from '../stores/entities/store-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreUser } from '../stores/entities/store-user.entity';
import { StoreUserPermission } from '../common/entities/store-user-permission.entity';

@Controller('stores/:storeId/permissions')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
    @InjectRepository(StoreUserPermission)
    private storeUserPermissionRepository: Repository<StoreUserPermission>,
  ) {}

  /**
   * Obtém as permissões de um usuário específico na loja
   */
  @Get('user/:userId')
  @RequirePermissions(Permission.MANAGE_PERMISSIONS)
  async getUserPermissions(
    @Param('storeId') storeId: string,
    @Param('userId') userId: string,
  ) {
    // Buscar o StoreUser correspondente
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário com ID ${userId} não está associado à loja com ID ${storeId}`);
    }

    // Obter as permissões usando o ID do StoreUser
    return this.permissionsService.getUserPermissions(userId, storeId);
  }

  /**
   * Atualiza as permissões de um usuário específico na loja
   */
  @Patch('user/:userId')
  @RequirePermissions(Permission.MANAGE_PERMISSIONS)
  async updateUserPermissions(
    @Param('storeId') storeId: string,
    @Param('userId') userId: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    // Buscar o StoreUser correspondente
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário com ID ${userId} não está associado à loja com ID ${storeId}`);
    }

    // Atualizar as permissões usando o ID do usuário e da loja
    return this.permissionsService.updateUserPermissions(userId, storeId, updatePermissionsDto.permissions);
  }

  /**
   * Redefine as permissões de um usuário para os valores padrão com base no papel
   */
  @Post('user/:userId/reset')
  @RequirePermissions(Permission.MANAGE_PERMISSIONS)
  async resetUserPermissions(
    @Param('storeId') storeId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    // Buscar o StoreUser correspondente
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário com ID ${userId} não está associado à loja com ID ${storeId}`);
    }

    // Usar o papel do usuário na loja para definir as permissões padrão
    const role = storeUser.role || req.storeUserRole || StoreRole.SELLER;
    return this.permissionsService.setDefaultPermissions(userId, storeId, role);
  }

  /**
   * Obtém as permissões do usuário atual na loja
   */
  @Get('me')
  async getCurrentUserPermissions(
    @Param('storeId') storeId: string,
    @Request() req: any,
  ) {
    console.log('PermissionsController - getCurrentUserPermissions - Request:', {
      storeId,
      user: req.user,
      headers: req.headers
    });

    // Obter o ID do usuário do token JWT
    const userId = req.user.sub || req.user.id || req.user.userId;

    if (!userId) {
      console.error('PermissionsController - getCurrentUserPermissions - ID do usuário não encontrado no token');
      throw new Error('ID do usuário não encontrado no token');
    }

    console.log(`PermissionsController - getCurrentUserPermissions - Buscando permissões para usuário ${userId} na loja ${storeId}`);

    try {
      const permissions = await this.permissionsService.getUserPermissions(userId, storeId);
      console.log(`PermissionsController - getCurrentUserPermissions - Permissões encontradas: ${permissions.length}`, permissions);
      return permissions;
    } catch (error) {
      console.error('PermissionsController - getCurrentUserPermissions - Erro:', error);
      throw error;
    }
  }

  /**
   * Endpoint de teste para verificar as permissões de um usuário
   */
  @Get('debug')
  async debugPermissions(
    @Param('storeId') storeId: string,
    @Request() req: any,
  ) {
    console.log('PermissionsController - debugPermissions - Request:', {
      storeId,
      user: req.user,
      headers: req.headers
    });

    // Obter o ID do usuário do token JWT
    const userId = req.user.sub || req.user.id || req.user.userId;

    if (!userId) {
      console.error('PermissionsController - debugPermissions - ID do usuário não encontrado no token');
      throw new Error('ID do usuário não encontrado no token');
    }

    try {
      // Buscar o StoreUser
      const storeUser = await this.storeUserRepository.findOne({
        where: {
          user: { id: userId },
          store: { id: storeId },
        },
        relations: ['user', 'store'],
      });

      // Buscar as permissões diretamente
      const permissions = await this.storeUserPermissionRepository.find({
        where: {
          store_user_id: storeUser?.id,
        },
      });

      // Extrair as permissões e remover duplicatas
      const permissionValues = permissions.map(p => p.permission);
      const uniquePermissions = [...new Set(permissionValues)];

      return {
        userId,
        storeId,
        storeUser,
        storeUserId: storeUser?.id,
        permissions: uniquePermissions,
        permissionsCount: permissions.length,
        uniquePermissionsCount: uniquePermissions.length,
        permissionsRaw: permissions,
      };
    } catch (error) {
      console.error('PermissionsController - debugPermissions - Erro:', error);
      return {
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
