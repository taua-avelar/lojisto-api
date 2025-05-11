import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreditSalesService } from './credit-sales.service';
import { CreateCreditSaleDto } from './dto/create-credit-sale.dto';
import { UpdateCreditSaleDto } from './dto/update-credit-sale.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { CancelInstallmentDto } from './dto/cancel-installment.dto';
import { UpdateInstallmentDueDateDto } from './dto/update-installment-due-date.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';

@Controller('stores/:storeId/credit-sales')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
export class CreditSalesController {
  constructor(private readonly creditSalesService: CreditSalesService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_CREDIT_SALES)
  create(@Param('storeId') storeId: string, @Body() createCreditSaleDto: CreateCreditSaleDto) {
    return this.creditSalesService.create(storeId, createCreditSaleDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findAll(@Param('storeId') storeId: string) {
    return this.creditSalesService.findAll(storeId);
  }

  @Get('overdue')
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findOverdueInstallments(@Param('storeId') storeId: string) {
    return this.creditSalesService.findOverdueInstallments(storeId);
  }

  @Get('upcoming')
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findUpcomingInstallments(@Param('storeId') storeId: string) {
    return this.creditSalesService.findUpcomingInstallments(storeId);
  }

  @Get('customer/:customerId')
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findByCustomer(@Param('storeId') storeId: string, @Param('customerId') customerId: string) {
    return this.creditSalesService.findByCustomer(storeId, customerId);
  }

  @Get(':id/installments')
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findInstallments(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.creditSalesService.findInstallments(storeId, id);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_CREDIT_SALES)
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.creditSalesService.findOne(storeId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.EDIT_CREDIT_SALES)
  update(@Param('storeId') storeId: string, @Param('id') id: string, @Body() updateCreditSaleDto: UpdateCreditSaleDto) {
    return this.creditSalesService.update(storeId, id, updateCreditSaleDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_SALES)
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.creditSalesService.remove(storeId, id);
  }

  @Post(':id/installments/:installmentId/pay')
  @RequirePermissions(Permission.MANAGE_INSTALLMENTS)
  payInstallment(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Body() payInstallmentDto: PayInstallmentDto
  ) {
    return this.creditSalesService.payInstallment(storeId, id, installmentId, payInstallmentDto);
  }

  @Post(':id/installments/:installmentId/cancel')
  @RequirePermissions(Permission.MANAGE_INSTALLMENTS)
  cancelInstallment(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Body() cancelInstallmentDto: CancelInstallmentDto
  ) {
    return this.creditSalesService.cancelInstallment(storeId, id, installmentId, cancelInstallmentDto);
  }

  @Patch(':id/installments/:installmentId/due-date')
  @RequirePermissions(Permission.MANAGE_INSTALLMENTS)
  updateInstallmentDueDate(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Body() updateInstallmentDueDateDto: UpdateInstallmentDueDateDto
  ) {
    return this.creditSalesService.updateInstallmentDueDate(storeId, id, installmentId, updateInstallmentDueDateDto);
  }
}
