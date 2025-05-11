import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/entities/store-user-permission.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('store/:storeId')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.CREATE_CATEGORIES)
  create(
    @Param('storeId') storeId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(createCategoryDto, storeId);
  }

  @Get('store/:storeId')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_CATEGORIES)
  findAll(@Param('storeId') storeId: string) {
    return this.categoriesService.findAll(storeId);
  }

  @Get(':id')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_CATEGORIES)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch('store/:storeId/:id')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.EDIT_CATEGORIES)
  update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, storeId);
  }

  @Delete('store/:storeId/:id')
  @UseGuards(StoreAccessGuard, PermissionsGuard)
  @RequirePermissions(Permission.DELETE_CATEGORIES)
  remove(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ) {
    return this.categoriesService.remove(id, storeId);
  }
}
