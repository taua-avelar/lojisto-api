import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, storeId: string): Promise<Customer> {
    // Buscar a loja
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Criar o cliente
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      store,
    });

    return this.customerRepository.save(customer);
  }

  async findAll(storeId: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { store: { id: storeId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, store: { id: storeId } },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found in store with ID ${storeId}`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, storeId: string): Promise<Customer> {
    // Buscar o cliente
    const customer = await this.findOne(id, storeId);

    // Atualizar o cliente
    Object.assign(customer, updateCustomerDto);

    return this.customerRepository.save(customer);
  }

  async remove(id: string, storeId: string): Promise<void> {
    // Buscar o cliente
    const customer = await this.findOne(id, storeId);

    // Soft delete do cliente
    await this.customerRepository.softRemove(customer);
  }
}
