import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';

@Controller('stores/:storeId/products')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
// Por padrão, apenas proprietários podem gerenciar produtos (criar, atualizar, excluir)
// Métodos específicos podem sobrescrever isso
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_PRODUCTS)
  create(
    @Param('storeId') storeId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto, storeId);
  }

  @Get()
  // Permitir que vendedores vejam produtos
  @RequirePermissions(Permission.VIEW_PRODUCTS)
  findAll(@Param('storeId') storeId: string) {
    return this.productsService.findAll(storeId);
  }

  @Get(':id')
  // Permitir que vendedores vejam produtos
  @RequirePermissions(Permission.VIEW_PRODUCTS)
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.productsService.findOne(id, storeId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.EDIT_PRODUCTS)
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto, storeId);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_PRODUCTS)
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.productsService.remove(id, storeId);
  }
}
