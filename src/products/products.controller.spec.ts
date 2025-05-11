import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionsService } from '../common/services/permissions.service';
import { Permission } from '../common/entities/user-permission.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { Category } from '../categories/entities/category.entity';
import { UserPermission } from '../common/entities/user-permission.entity';
import { StoreUser } from '../stores/entities/store-user.entity';

// Mock dos guards
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockStoreAccessGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockPermissionsGuard = { canActivate: jest.fn() };

// Mock do serviço de permissões
const mockPermissionsService = {
  hasPermission: jest.fn(),
};

// Mock do serviço de produtos
const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock dos repositórios
const mockProductRepository = {};
const mockStoreRepository = {};
const mockCategoryRepository = {};
const mockUserPermissionRepository = {};
const mockStoreUserRepository = {};

describe('ProductsController', () => {
  let controller: ProductsController;
  let permissionsService: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(UserPermission),
          useValue: mockUserPermissionRepository,
        },
        {
          provide: getRepositoryToken(StoreUser),
          useValue: mockStoreUserRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(StoreAccessGuard)
      .useValue(mockStoreAccessGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should require CREATE_PRODUCTS permission', async () => {
      // Configurar o mock do PermissionsGuard para verificar a permissão
      mockPermissionsGuard.canActivate.mockImplementation(async (context) => {
        const handler = context.getHandler();
        const requiredPermissions = Reflect.getMetadata('permissions', handler);
        
        // Verificar se a permissão CREATE_PRODUCTS é requerida
        expect(requiredPermissions).toContain(Permission.CREATE_PRODUCTS);
        
        // Simular que o usuário tem a permissão
        return true;
      });

      // Chamar o método create
      const createProductDto = { name: 'Test Product', price: 10 };
      await controller.create('store-id', createProductDto);

      // Verificar se o guard foi chamado
      expect(mockPermissionsGuard.canActivate).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should require VIEW_PRODUCTS permission', async () => {
      // Configurar o mock do PermissionsGuard para verificar a permissão
      mockPermissionsGuard.canActivate.mockImplementation(async (context) => {
        const handler = context.getHandler();
        const requiredPermissions = Reflect.getMetadata('permissions', handler);
        
        // Verificar se a permissão VIEW_PRODUCTS é requerida
        expect(requiredPermissions).toContain(Permission.VIEW_PRODUCTS);
        
        // Simular que o usuário tem a permissão
        return true;
      });

      // Chamar o método findAll
      await controller.findAll('store-id');

      // Verificar se o guard foi chamado
      expect(mockPermissionsGuard.canActivate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should require EDIT_PRODUCTS permission', async () => {
      // Configurar o mock do PermissionsGuard para verificar a permissão
      mockPermissionsGuard.canActivate.mockImplementation(async (context) => {
        const handler = context.getHandler();
        const requiredPermissions = Reflect.getMetadata('permissions', handler);
        
        // Verificar se a permissão EDIT_PRODUCTS é requerida
        expect(requiredPermissions).toContain(Permission.EDIT_PRODUCTS);
        
        // Simular que o usuário tem a permissão
        return true;
      });

      // Chamar o método update
      const updateProductDto = { name: 'Updated Product' };
      await controller.update('product-id', 'store-id', updateProductDto);

      // Verificar se o guard foi chamado
      expect(mockPermissionsGuard.canActivate).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should require DELETE_PRODUCTS permission', async () => {
      // Configurar o mock do PermissionsGuard para verificar a permissão
      mockPermissionsGuard.canActivate.mockImplementation(async (context) => {
        const handler = context.getHandler();
        const requiredPermissions = Reflect.getMetadata('permissions', handler);
        
        // Verificar se a permissão DELETE_PRODUCTS é requerida
        expect(requiredPermissions).toContain(Permission.DELETE_PRODUCTS);
        
        // Simular que o usuário tem a permissão
        return true;
      });

      // Chamar o método remove
      await controller.remove('product-id', 'store-id');

      // Verificar se o guard foi chamado
      expect(mockPermissionsGuard.canActivate).toHaveBeenCalled();
    });
  });
});
