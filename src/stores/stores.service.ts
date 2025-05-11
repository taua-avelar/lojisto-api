import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { StoreUser, StoreRole } from './entities/store-user.entity';
import { StoreConfig } from './entities/store-config.entity';
import { User } from '../users/entities/user.entity';
import { AddUserToStoreDto } from './dto/add-user-to-store.dto';
import { UpdateStoreUserRoleDto } from './dto/update-store-user-role.dto';
import { UpdateStoreUserCommissionsDto } from './dto/update-store-user-commissions.dto';
import { StoreConfigDto } from './dto/store-config.dto';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../common/services/permissions.service';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StoreConfig)
    private storeConfigRepository: Repository<StoreConfig>,
    private usersService: UsersService,
    private permissionsService: PermissionsService,
  ) {}

  async findStoresByUser(userId: string): Promise<{ store: Store; role: StoreRole }[]> {
    const storeUsers = await this.storeUserRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['store'],
    });

    return storeUsers.map(storeUser => ({
      store: storeUser.store,
      role: storeUser.role
    }));
  }

  // Verificar se o usuário tem acesso à loja e qual é o seu papel
  async checkUserStoreAccess(userId: string, storeId: string): Promise<{ hasAccess: boolean; role?: StoreRole }> {
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userId },
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      return { hasAccess: false };
    }

    return { hasAccess: true, role: storeUser.role };
  }

  // Obter todos os usuários de uma loja
  async findStoreUsers(storeId: string, requestUserId: string): Promise<StoreUser[]> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem visualizar a lista de usuários da loja');
    }

    // Buscar todos os usuários da loja
    return this.storeUserRepository.find({
      where: {
        store: { id: storeId },
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Adicionar um usuário à loja
  async addUserToStore(storeId: string, addUserDto: AddUserToStoreDto, requestUserId: string): Promise<{ storeUser: StoreUser; isNewUser?: boolean; temporaryPassword?: string }> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário solicitante tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem adicionar usuários à loja');
    }

    // Encontrar ou criar o usuário a ser adicionado
    let userResult: { user: User; isNewUser: boolean; temporaryPassword?: string };

    if (addUserDto.userId) {
      // Se o ID do usuário foi fornecido
      const existingUser = await this.userRepository.findOne({
        where: { id: addUserDto.userId },
      });

      if (!existingUser) {
        throw new NotFoundException(`Usuário com ID ${addUserDto.userId} não encontrado`);
      }

      userResult = { user: existingUser, isNewUser: false };
    } else if (addUserDto.email) {
      // Se o email do usuário foi fornecido
      try {
        // Tentar encontrar ou criar o usuário
        userResult = await this.usersService.createOrFind(addUserDto.email);
      } catch (error) {
        throw new BadRequestException(`Erro ao criar usuário: ${error.message}`);
      }
    } else {
      throw new BadRequestException('É necessário fornecer o ID ou o email do usuário');
    }

    // Garantir que o usuário foi encontrado ou criado
    if (!userResult.user) {
      throw new BadRequestException('Não foi possível encontrar ou criar o usuário');
    }

    // Verificar se o usuário já está associado à loja
    const existingStoreUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: userResult.user.id },
        store: { id: storeId },
      },
    });

    if (existingStoreUser) {
      throw new BadRequestException('Este usuário já está associado a esta loja');
    }

    // Criar a associação entre usuário e loja
    const storeUser = this.storeUserRepository.create({
      user: userResult.user,
      store,
      role: addUserDto.role,
    });

    const savedStoreUser = await this.storeUserRepository.save(storeUser);

    // Definir permissões padrão com base no papel do usuário
    try {
      await this.permissionsService.setDefaultPermissions(
        userResult.user.id,
        storeId,
        addUserDto.role
      );
      console.log(`Permissões padrão definidas para o usuário ${userResult.user.id} na loja ${storeId} com papel ${addUserDto.role}`);
    } catch (error) {
      console.error(`Erro ao definir permissões padrão para o usuário ${userResult.user.id}:`, error);
      // Não lançar erro para não interromper o fluxo principal
    }

    // Retornar informações adicionais se um novo usuário foi criado
    if (userResult.isNewUser) {
      return {
        storeUser: savedStoreUser,
        isNewUser: true,
        temporaryPassword: userResult.temporaryPassword
      };
    }

    return { storeUser: savedStoreUser };
  }

  // Atualizar o papel de um usuário na loja
  async updateUserRole(storeId: string, storeUserId: string, updateRoleDto: UpdateStoreUserRoleDto, requestUserId: string): Promise<StoreUser> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário solicitante tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem atualizar papéis de usuários');
    }

    // Buscar a associação entre usuário e loja
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        id: storeUserId,
        store: { id: storeId },
      },
      relations: ['user'],
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário da loja com ID ${storeUserId} não encontrado`);
    }

    // Atualizar o papel do usuário
    storeUser.role = updateRoleDto.role;

    // Salvar a atualização
    const updatedStoreUser = await this.storeUserRepository.save(storeUser);

    // Atualizar as permissões com base no novo papel
    try {
      await this.permissionsService.setDefaultPermissions(
        storeUser.user.id,
        storeId,
        updateRoleDto.role
      );
      console.log(`Permissões atualizadas para o usuário ${storeUser.user.id} na loja ${storeId} com novo papel ${updateRoleDto.role}`);
    } catch (error) {
      console.error(`Erro ao atualizar permissões para o usuário ${storeUser.user.id}:`, error);
      // Não lançar erro para não interromper o fluxo principal
    }

    return updatedStoreUser;
  }

  // Atualizar as configurações de comissão de um usuário na loja
  async updateUserCommissions(storeId: string, storeUserId: string, updateCommissionsDto: UpdateStoreUserCommissionsDto, requestUserId: string): Promise<StoreUser> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário solicitante tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem atualizar configurações de comissão');
    }

    // Buscar a associação entre usuário e loja
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        id: storeUserId,
        store: { id: storeId },
      },
      relations: ['user'],
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário da loja com ID ${storeUserId} não encontrado`);
    }

    // Atualizar a configuração de comissão do usuário
    storeUser.receiveCommissions = updateCommissionsDto.receiveCommissions;

    return this.storeUserRepository.save(storeUser);
  }

  // Remover um usuário da loja
  async removeUserFromStore(storeId: string, storeUserId: string, requestUserId: string): Promise<void> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário solicitante tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem remover usuários da loja');
    }

    // Buscar a associação entre usuário e loja
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        id: storeUserId,
        store: { id: storeId },
      },
    });

    if (!storeUser) {
      throw new NotFoundException(`Usuário da loja com ID ${storeUserId} não encontrado`);
    }

    // Remover a associação
    await this.storeUserRepository.remove(storeUser);
  }

  // Obter as configurações da loja
  async getStoreConfig(storeId: string): Promise<StoreConfig> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Buscar a configuração da loja
    let config = await this.storeConfigRepository.findOne({
      where: {
        store: { id: storeId },
        isDeleted: false,
      },
      relations: ['store'],
    });

    // Se não existir, criar uma configuração padrão
    if (!config) {
      config = this.storeConfigRepository.create({
        store,
        lowStockThreshold: 10, // Valor padrão
        isDeleted: false,
      });

      config = await this.storeConfigRepository.save(config);
    }

    return config;
  }

  // Atualizar as configurações da loja
  async updateStoreConfig(storeId: string, configDto: StoreConfigDto, requestUserId: string): Promise<StoreConfig> {
    // Verificar se a loja existe
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${storeId} não encontrada`);
    }

    // Verificar se o usuário solicitante tem acesso à loja e é proprietário
    const { hasAccess, role } = await this.checkUserStoreAccess(requestUserId, storeId);
    if (!hasAccess || role !== StoreRole.OWNER) {
      throw new ForbiddenException('Apenas proprietários podem atualizar configurações da loja');
    }

    // Buscar a configuração atual
    let config = await this.storeConfigRepository.findOne({
      where: {
        store: { id: storeId },
        isDeleted: false,
      },
      relations: ['store'],
    });

    // Se não existir, criar uma nova
    if (!config) {
      config = this.storeConfigRepository.create({
        store,
        isDeleted: false,
      });
    }

    // Atualizar os campos
    if (configDto.lowStockThreshold !== undefined) {
      config.lowStockThreshold = configDto.lowStockThreshold;
    }

    // Salvar as alterações
    return this.storeConfigRepository.save(config);
  }
}
