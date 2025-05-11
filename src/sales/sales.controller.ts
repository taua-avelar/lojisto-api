import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';

@Controller('stores/:storeId/sales')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
// Permissões específicas serão verificadas em cada método
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_SALES)
  create(
    @Param('storeId') storeId: string,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.create(createSaleDto, storeId);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_SALES)
  findAll(@Param('storeId') storeId: string) {
    return this.salesService.findAll(storeId);
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_SALES)
  getStats(@Param('storeId') storeId: string) {
    return this.salesService.getSalesStats(storeId);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_SALES)
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.salesService.findOne(id, storeId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.EDIT_SALES)
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, updateSaleDto, storeId);
  }

  @Delete(':id')
  // Apenas usuários com permissão específica podem excluir vendas
  @RequirePermissions(Permission.DELETE_SALES)
  remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.salesService.remove(id, storeId);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.CANCEL_SALES)
  cancel(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.salesService.cancel(id, storeId);
  }
}
