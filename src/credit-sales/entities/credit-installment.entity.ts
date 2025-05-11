import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { CreditSale } from './credit-sale.entity';

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELED = 'CANCELED'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  DEBIT = 'debit',
  PIX = 'pix',
  TRANSFER = 'transfer'
}

@Entity('credit_installments')
export class CreditInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CreditSale, creditSale => creditSale.installmentsList, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_sale_id' })
  creditSale: CreditSale;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  payment_date: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING
  })
  status: InstallmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
