import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { StoreUser } from './store-user.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  name: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Column()
  @IsString()
  address: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  phone: string;

  @Column({ nullable: true })
  @IsEmail()
  @IsOptional()
  email: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  logo: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => StoreUser, storeUser => storeUser.store)
  storeUsers: StoreUser[];

  @OneToMany(() => Product, product => product.store)
  products: Product[];

  @OneToMany(() => Category, category => category.store)
  categories: Category[];

  @OneToMany(() => Customer, customer => customer.store)
  customers: Customer[];

  @OneToMany(() => Sale, sale => sale.store)
  sales: Sale[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
