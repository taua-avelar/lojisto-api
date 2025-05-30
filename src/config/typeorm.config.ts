import { DataSource } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Store } from "../stores/entities/store.entity";
import { StoreUser } from "../stores/entities/store-user.entity";
import { Product } from "../products/entities/product.entity";
import { Category } from "../categories/entities/category.entity";
import { Customer } from "../customers/entities/customer.entity";
import { Sale } from "../sales/entities/sale.entity";
import { SaleItem } from "../sales/entities/sale-item.entity";
import { Commission } from "../commissions/entities/commission.entity";
import { CommissionConfig } from "../commissions/entities/commission-config.entity";
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "back_gestao_loja",
  entities: [User, Store, StoreUser, Product, Category, Customer, Sale, SaleItem, Commission, CommissionConfig],
  migrations: ["migrations/*.ts", "src/migrations/*.ts"],
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: false
  } : false,
});