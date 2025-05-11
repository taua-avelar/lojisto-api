import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, storeId: string): Promise<Category> {
    // Buscar a loja
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Criar a categoria
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      store,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(storeId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { store: { id: storeId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, storeId: string): Promise<Category> {
    // Buscar a categoria e verificar se pertence à loja
    const category = await this.categoryRepository.findOne({
      where: { id, store: { id: storeId } },
      relations: ['store'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found in store with ID ${storeId}`);
    }

    // Atualizar a categoria
    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  async remove(id: string, storeId: string): Promise<void> {
    // Buscar a categoria e verificar se pertence à loja
    const category = await this.categoryRepository.findOne({
      where: { id, store: { id: storeId } },
      relations: ['store'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found in store with ID ${storeId}`);
    }

    // Usar soft delete em vez de remoção física
    await this.categoryRepository.softRemove(category);
  }
}
