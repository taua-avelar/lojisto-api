import { MigrationInterface, QueryRunner } from "typeorm";

export class StandardizeSnakeCase1745100000000 implements MigrationInterface {
    name = 'StandardizeSnakeCase1745100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Renomear colunas na tabela products
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "isActive" TO "is_active"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "updatedAt" TO "updated_at"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "storeId" TO "store_id"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "categoryId" TO "category_id"`);

        // Renomear colunas na tabela categories
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "isActive" TO "is_active"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "updatedAt" TO "updated_at"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "storeId" TO "store_id"`);

        // Renomear colunas na tabela customers
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "isActive" TO "is_active"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "updatedAt" TO "updated_at"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "storeId" TO "store_id"`);

        // Renomear colunas na tabela sales
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "paymentMethod" TO "payment_method"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "customerId" TO "customer_id"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "storeId" TO "store_id"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Renomear colunas na tabela sale_items
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "saleId" TO "sale_id"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "productId" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Renomear colunas na tabela stores
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "isActive" TO "is_active"`);
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Renomear colunas na tabela users
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Renomear colunas na tabela store_users
        await queryRunner.query(`ALTER TABLE "store_users" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "store_users" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Remover e recriar as chaves estrangeiras com nomes padronizados
        // Products -> Store
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_store"`);
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "fk_products_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Products -> Category
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "fk_products_category" 
            FOREIGN KEY ("category_id") 
            REFERENCES "categories"("id") 
            ON DELETE SET NULL
        `);

        // Categories -> Store
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_store"`);
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "fk_categories_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Customers -> Store
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "FK_customers_stores_store_id"`);
        await queryRunner.query(`
            ALTER TABLE "customers" 
            ADD CONSTRAINT "fk_customers_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Sales -> Customer
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_customers_customer_id"`);
        await queryRunner.query(`
            ALTER TABLE "sales" 
            ADD CONSTRAINT "fk_sales_customer" 
            FOREIGN KEY ("customer_id") 
            REFERENCES "customers"("id") 
            ON DELETE SET NULL
        `);

        // Sales -> Store
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_stores_store_id"`);
        await queryRunner.query(`
            ALTER TABLE "sales" 
            ADD CONSTRAINT "fk_sales_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // SaleItems -> Sale
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_sales_sale_id"`);
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD CONSTRAINT "fk_sale_items_sale" 
            FOREIGN KEY ("sale_id") 
            REFERENCES "sales"("id") 
            ON DELETE CASCADE
        `);

        // SaleItems -> Product
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_products_product_id"`);
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD CONSTRAINT "fk_sale_items_product" 
            FOREIGN KEY ("product_id") 
            REFERENCES "products"("id") 
            ON DELETE SET NULL
        `);

        // StoreUsers -> User
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_store_users_user"`);
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "fk_store_users_user" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        // StoreUsers -> Store
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_store_users_store"`);
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "fk_store_users_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurar chaves estrangeiras
        // StoreUsers -> Store
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "fk_store_users_store"`);
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "FK_store_users_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // StoreUsers -> User
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "fk_store_users_user"`);
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "FK_store_users_user" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        // SaleItems -> Product
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "fk_sale_items_product"`);
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD CONSTRAINT "FK_sale_items_products_product_id" 
            FOREIGN KEY ("product_id") 
            REFERENCES "products"("id") 
            ON DELETE SET NULL
        `);

        // SaleItems -> Sale
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "fk_sale_items_sale"`);
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD CONSTRAINT "FK_sale_items_sales_sale_id" 
            FOREIGN KEY ("sale_id") 
            REFERENCES "sales"("id") 
            ON DELETE CASCADE
        `);

        // Sales -> Store
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "fk_sales_store"`);
        await queryRunner.query(`
            ALTER TABLE "sales" 
            ADD CONSTRAINT "FK_sales_stores_store_id" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Sales -> Customer
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "fk_sales_customer"`);
        await queryRunner.query(`
            ALTER TABLE "sales" 
            ADD CONSTRAINT "FK_sales_customers_customer_id" 
            FOREIGN KEY ("customer_id") 
            REFERENCES "customers"("id") 
            ON DELETE SET NULL
        `);

        // Customers -> Store
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "fk_customers_store"`);
        await queryRunner.query(`
            ALTER TABLE "customers" 
            ADD CONSTRAINT "FK_customers_stores_store_id" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Categories -> Store
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "fk_categories_store"`);
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "FK_categories_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Products -> Category
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_category"`);
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_category" 
            FOREIGN KEY ("category_id") 
            REFERENCES "categories"("id") 
            ON DELETE SET NULL
        `);

        // Products -> Store
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_store"`);
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_store" 
            FOREIGN KEY ("store_id") 
            REFERENCES "stores"("id") 
            ON DELETE CASCADE
        `);

        // Renomear colunas de volta na tabela store_users
        await queryRunner.query(`ALTER TABLE "store_users" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "store_users" RENAME COLUMN "updated_at" TO "updatedAt"`);

        // Renomear colunas de volta na tabela users
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updated_at" TO "updatedAt"`);

        // Renomear colunas de volta na tabela stores
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "is_active" TO "isActive"`);
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "stores" RENAME COLUMN "updated_at" TO "updatedAt"`);

        // Renomear colunas de volta na tabela sale_items
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "sale_id" TO "saleId"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "product_id" TO "productId"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "sale_items" RENAME COLUMN "updated_at" TO "updatedAt"`);

        // Renomear colunas de volta na tabela sales
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "payment_method" TO "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "customer_id" TO "customerId"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "store_id" TO "storeId"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME COLUMN "updated_at" TO "updatedAt"`);

        // Renomear colunas de volta na tabela customers
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "is_active" TO "isActive"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "updated_at" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "store_id" TO "storeId"`);

        // Renomear colunas de volta na tabela categories
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "is_active" TO "isActive"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "updated_at" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "store_id" TO "storeId"`);

        // Renomear colunas de volta na tabela products
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "is_active" TO "isActive"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "updated_at" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "store_id" TO "storeId"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "category_id" TO "categoryId"`);
    }
}
