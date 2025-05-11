import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';
import { CreateCommissionConfigDto } from './dto/create-commission-config.dto';
import { UpdateCommissionConfigDto } from './dto/update-commission-config.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { CommissionStatus } from './entities/commission.entity';

@Controller('stores/:storeId/commissions')
@UseGuards(JwtAuthGuard, StoreAccessGuard, PermissionsGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // Commission Config Endpoints
  @Post('config')
  @RequirePermissions(Permission.MANAGE_COMMISSIONS)
  createCommissionConfig(
    @Param('storeId') storeId: string,
    @Body() createCommissionConfigDto: CreateCommissionConfigDto,
  ) {
    return this.commissionsService.createCommissionConfig(storeId, createCommissionConfigDto);
  }

  @Get('config')
  @RequirePermissions(Permission.VIEW_STORE_CONFIG)
  getCommissionConfig(@Param('storeId') storeId: string) {
    return this.commissionsService.getCommissionConfig(storeId);
  }

  @Get('config/history')
  @RequirePermissions(Permission.MANAGE_COMMISSIONS)
  getCommissionConfigHistory(@Param('storeId') storeId: string) {
    return this.commissionsService.getCommissionConfigHistory(storeId);
  }

  @Patch('config/:id')
  @RequirePermissions(Permission.MANAGE_COMMISSIONS)
  updateCommissionConfig(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateCommissionConfigDto: UpdateCommissionConfigDto,
  ) {
    return this.commissionsService.updateCommissionConfig(storeId, id, updateCommissionConfigDto);
  }

  // Commission Endpoints
  @Get()
  @RequirePermissions(Permission.VIEW_ALL_COMMISSIONS)
  getCommissions(
    @Param('storeId') storeId: string,
    @Query('status') status?: CommissionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.commissionsService.getCommissionsByStore(storeId, status, start, end);
  }

  @Get('summary')
  @RequirePermissions(Permission.VIEW_ALL_COMMISSIONS)
  getCommissionSummary(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    console.log('Controller - getCommissionSummary - Raw date params:', { startDate, endDate });

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    console.log('Controller - getCommissionSummary - Parsed dates:', {
      start: start ? start.toISOString() : undefined,
      end: end ? end.toISOString() : undefined
    });

    return this.commissionsService.getCommissionSummaryByStore(storeId, start, end);
  }

  @Get('seller/:sellerId/today')
  @RequirePermissions(Permission.VIEW_OWN_COMMISSIONS)
  getSellerTodayCommissions(
    @Param('storeId') storeId: string,
    @Param('sellerId') sellerId: string,
  ) {
    console.log('Controller - getSellerTodayCommissions - Getting today commissions');
    return this.commissionsService.getTodayCommissionsBySeller(storeId, sellerId);
  }

  @Get('seller/:sellerId')
  @RequirePermissions(Permission.VIEW_OWN_COMMISSIONS)
  getSellerCommissions(
    @Param('storeId') storeId: string,
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('today') today?: string,
  ) {
    console.log('Controller - getSellerCommissions - Raw date params:', { startDate, endDate, today });

    // Se o parâmetro 'today' estiver presente, buscar apenas as comissões do dia atual
    if (today === 'true') {
      console.log('Controller - getSellerCommissions - Using today filter');
      return this.commissionsService.getTodayCommissionsBySeller(storeId, sellerId);
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    console.log('Controller - getSellerCommissions - Parsed dates:', {
      start: start ? start.toISOString() : undefined,
      end: end ? end.toISOString() : undefined
    });

    return this.commissionsService.getCommissionsBySeller(storeId, sellerId, start, end);
  }

  @Get('seller/:sellerId/summary')
  @RequirePermissions(Permission.VIEW_OWN_COMMISSIONS)
  getSellerCommissionSummary(
    @Param('storeId') storeId: string,
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.commissionsService.getCommissionSummaryBySeller(storeId, sellerId, start, end);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_ALL_COMMISSIONS)
  getCommission(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    return this.commissionsService.getCommissionById(storeId, id);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.MANAGE_COMMISSIONS)
  updateCommissionStatus(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCommissionStatusDto,
  ) {
    return this.commissionsService.updateCommissionStatus(storeId, id, updateStatusDto);
  }
}
