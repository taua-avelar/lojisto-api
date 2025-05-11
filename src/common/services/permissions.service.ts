import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreUserPermission, Permission } from '../entities/store-user-permission.entity';
import { StoreUser, StoreRole } from '../../stores/entities/store-user.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(StoreUserPermission)
    private userPermissionRepository: Repository<StoreUserPermission>,
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
  ) {}



  /**
   * Encontra o ID do StoreUser para um usuário e loja específicos
   */
  private async getStoreUserId(userId: string, storeId: string): Promise<string> {
    console.log(`PermissionsService - getStoreUserId - Buscando StoreUser para usuário ${userId} na loja ${storeId}`);

    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      console.error(`PermissionsService - getStoreUserId - Usuário ${userId} não está associado à loja ${storeId}`);
      throw new NotFoundException(`Usuário com ID ${userId} não está associado à loja com ID ${storeId}`);
    }

    console.log(`PermissionsService - getStoreUserId - StoreUser encontrado: ${storeUser.id}, role: ${storeUser.role}`);
    return storeUser.id;
  }

  /**
   * Obtém todas as permissões de um usuário em uma loja específica
   */
  async getUserPermissions(userId: string, storeId: string): Promise<Permission[]> {
    console.log(`PermissionsService - getUserPermissions - Buscando permissões para usuário ${userId} na loja ${storeId}`);

    try {
      const storeUserId = await this.getStoreUserId(userId, storeId);
      console.log(`PermissionsService - getUserPermissions - StoreUser ID encontrado: ${storeUserId}`);

      // Buscar todas as permissões do usuário na loja
      const userPermissions = await this.userPermissionRepository.find({
        where: {
          store_user_id: storeUserId
        },
      });

      // Extrair as permissões e remover duplicatas
      const permissions = userPermissions.map(up => up.permission);
      const uniquePermissions = [...new Set(permissions)];

      console.log(`PermissionsService - getUserPermissions - Permissões encontradas: ${userPermissions.length}, Permissões únicas: ${uniquePermissions.length}`,
        uniquePermissions);

      return uniquePermissions;
    } catch (error) {
      // Se o usuário não estiver associado à loja, retorna um array vazio
      if (error instanceof NotFoundException) {
        console.log(`PermissionsService - getUserPermissions - Usuário ${userId} não está associado à loja ${storeId}, retornando array vazio`);
        return [];
      }
      console.error(`PermissionsService - getUserPermissions - Erro:`, error);
      throw error;
    }
  }

  /**
   * Verifica se um usuário tem uma permissão específica em uma loja
   */
  async hasPermission(userId: string, storeId: string, permission: Permission): Promise<boolean> {
    try {
      const storeUserId = await this.getStoreUserId(userId, storeId);

      // Verificar se o usuário tem a permissão
      const count = await this.userPermissionRepository.count({
        where: {
          store_user_id: storeUserId,
          permission
        },
      });

      return count > 0;
    } catch (error) {
      // Se o usuário não estiver associado à loja, retorna false
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Concede uma permissão específica a um usuário em uma loja
   */
  async grantPermission(userId: string, storeId: string, permission: Permission): Promise<StoreUserPermission> {
    const storeUserId = await this.getStoreUserId(userId, storeId);

    // Verificar se a permissão já existe
    const existingPermission = await this.userPermissionRepository.findOne({
      where: {
        store_user_id: storeUserId,
        permission,
      },
    });

    if (existingPermission) {
      return existingPermission;
    }

    // Criar nova permissão
    const userPermission = this.userPermissionRepository.create({
      store_user_id: storeUserId,
      permission,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  /**
   * Revoga uma permissão específica de um usuário em uma loja
   */
  async revokePermission(userId: string, storeId: string, permission: Permission): Promise<void> {
    const storeUserId = await this.getStoreUserId(userId, storeId);

    await this.userPermissionRepository.delete({
      store_user_id: storeUserId,
      permission,
    });
  }

  /**
   * Atualiza todas as permissões de um usuário em uma loja
   */
  async updateUserPermissions(userId: string, storeId: string, permissions: Permission[]): Promise<void> {
    const storeUserId = await this.getStoreUserId(userId, storeId);

    // Primeiro, remover todas as permissões existentes para este usuário e loja
    await this.userPermissionRepository.delete({
      store_user_id: storeUserId,
    });

    // Depois, adicionar as novas permissões
    const permissionEntities = permissions.map(permission =>
      this.userPermissionRepository.create({
        store_user_id: storeUserId,
        permission,
      })
    );

    if (permissionEntities.length > 0) {
      await this.userPermissionRepository.save(permissionEntities);
    }
  }

  /**
   * Define as permissões padrão para um usuário em uma loja com base no papel
   */
  async setDefaultPermissions(userId: string, storeId: string, role: StoreRole = StoreRole.SELLER): Promise<void> {
    const storeUserId = await this.getStoreUserId(userId, storeId);

    // Primeiro, remover todas as permissões existentes para este usuário e loja
    await this.userPermissionRepository.delete({
      store_user_id: storeUserId,
    });

    let permissions: Permission[] = [];

    if (role === StoreRole.OWNER) {
      // Proprietários recebem todas as permissões
      permissions = Object.values(Permission);
    } else if (role === StoreRole.SELLER) {
      // Permissões padrão para vendedores
      permissions = [
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_CATEGORIES,
        Permission.VIEW_CUSTOMERS,
        Permission.VIEW_SALES,
        Permission.CREATE_SALES,
        Permission.VIEW_CREDIT_SALES,
        Permission.CREATE_CREDIT_SALES,
        Permission.VIEW_OWN_COMMISSIONS,
        Permission.VIEW_REPORTS, // Adicionado para que vendedores possam ver relatórios
        Permission.VIEW_STORE_CONFIG, // Adicionado para que todos os usuários possam ver as configurações da loja
      ];
    }

    // Criar entidades de permissão
    const permissionEntities = permissions.map(permission =>
      this.userPermissionRepository.create({
        store_user_id: storeUserId,
        permission,
      })
    );

    if (permissionEntities.length > 0) {
      await this.userPermissionRepository.save(permissionEntities);
    }
  }
}
