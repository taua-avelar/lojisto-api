import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';

@Controller('stores/:storeId/customers')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
// Permissões específicas serão verificadas em cada método
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_CUSTOMERS)
  create(
    @Param('storeId') storeId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(createCustomerDto, storeId);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  findAll(@Param('storeId') storeId: string) {
    return this.customersService.findAll(storeId);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.customersService.findOne(id, storeId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.EDIT_CUSTOMERS)
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto, storeId);
  }

  @Delete(':id')
  // Apenas usuários com permissão específica podem excluir clientes
  @RequirePermissions(Permission.DELETE_CUSTOMERS)
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.customersService.remove(id, storeId);
  }
}
