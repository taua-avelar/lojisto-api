import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Store } from '../../stores/entities/store.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { CreditInstallment } from './credit-installment.entity';

export enum CreditSaleStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

@Entity('credit_sales')
export class CreditSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToOne(() => Sale, sale => sale.creditSale, { cascade: ['soft-remove'], nullable: false })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  down_payment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  remaining_amount: number;

  @Column({ type: 'int' })
  installments: number;

  @OneToMany(() => CreditInstallment, installment => installment.creditSale, { cascade: true })
  installmentsList: CreditInstallment[];

  @Column({
    type: 'enum',
    enum: CreditSaleStatus,
    default: CreditSaleStatus.ACTIVE
  })
  status: CreditSaleStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
