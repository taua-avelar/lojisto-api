import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StoreUser } from '../../stores/entities/store-user.entity';

export enum Permission {
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',

  VIEW_CATEGORIES = 'view_categories',
  CREATE_CATEGORIES = 'create_categories',
  EDIT_CATEGORIES = 'edit_categories',
  DELETE_CATEGORIES = 'delete_categories',

  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMERS = 'create_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',

  VIEW_SALES = 'view_sales',
  CREATE_SALES = 'create_sales',
  EDIT_SALES = 'edit_sales',
  DELETE_SALES = 'delete_sales',
  CANCEL_SALES = 'cancel_sales',

  VIEW_CREDIT_SALES = 'view_credit_sales',
  CREATE_CREDIT_SALES = 'create_credit_sales',
  EDIT_CREDIT_SALES = 'edit_credit_sales',
  DELETE_CREDIT_SALES = 'delete_credit_sales',
  MANAGE_INSTALLMENTS = 'manage_installments',

  VIEW_COMMISSIONS = 'view_commissions',
  CREATE_COMMISSIONS = 'create_commissions',
  EDIT_COMMISSIONS = 'edit_commissions',
  DELETE_COMMISSIONS = 'delete_commissions',
  MANAGE_COMMISSIONS = 'manage_commissions',
  VIEW_ALL_COMMISSIONS = 'view_all_commissions',
  VIEW_OWN_COMMISSIONS = 'view_own_commissions',

  VIEW_REPORTS = 'view_reports',

  VIEW_STORES = 'view_stores',
  CREATE_STORES = 'create_stores',
  EDIT_STORES = 'edit_stores',
  DELETE_STORES = 'delete_stores',
  VIEW_STORE_USERS = 'view_store_users',
  MANAGE_STORE_USERS = 'manage_store_users',
  VIEW_STORE_CONFIG = 'view_store_config',
  EDIT_STORE_CONFIG = 'edit_store_config',

  MANAGE_USERS = 'manage_users',
  MANAGE_PERMISSIONS = 'manage_permissions',
}

@Entity('store_user_permissions')
export class StoreUserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  store_user_id: string;

  @Column({
    type: 'enum',
    enum: Permission,
  })
  permission: Permission;

  @ManyToOne(() => StoreUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_user_id' })
  storeUser: StoreUser;
}
