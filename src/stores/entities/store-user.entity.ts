import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { IsEnum, IsBoolean } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Store } from './store.entity';

export enum StoreRole {
  OWNER = 'owner',
  SELLER = 'seller'
}

@Entity('store_users')
export class StoreUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, store => store.storeUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({
    name: 'role',
    type: 'enum',
    enum: StoreRole,
    default: StoreRole.SELLER,
    enumName: 'store_role_enum' // Nome explícito para o tipo enum no PostgreSQL
  })
  @IsEnum(StoreRole)
  role: StoreRole;

  @Column({
    name: 'receive_commissions',
    type: 'boolean',
    default: true
  })
  @IsBoolean()
  receiveCommissions: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
