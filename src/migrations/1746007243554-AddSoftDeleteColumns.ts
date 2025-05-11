import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteColumns1746007243554 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add deleted_at column to users table
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to stores table
        await queryRunner.query(`
            ALTER TABLE "stores"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to store_users table
        await queryRunner.query(`
            ALTER TABLE "store_users"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to products table
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to categories table
        await queryRunner.query(`
            ALTER TABLE "categories"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to customers table
        await queryRunner.query(`
            ALTER TABLE "customers"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to sales table
        await queryRunner.query(`
            ALTER TABLE "sales"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to sale_items table
        await queryRunner.query(`
            ALTER TABLE "sale_items"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to commissions table
        await queryRunner.query(`
            ALTER TABLE "commissions"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to commission_configs table
        await queryRunner.query(`
            ALTER TABLE "commission_configs"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to credit_sales table
        await queryRunner.query(`
            ALTER TABLE "credit_sales"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);

        // Add deleted_at column to credit_installments table
        await queryRunner.query(`
            ALTER TABLE "credit_installments"
            ADD COLUMN "deleted_at" TIMESTAMP NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove deleted_at column from users table
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from stores table
        await queryRunner.query(`
            ALTER TABLE "stores"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from store_users table
        await queryRunner.query(`
            ALTER TABLE "store_users"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from products table
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from categories table
        await queryRunner.query(`
            ALTER TABLE "categories"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from customers table
        await queryRunner.query(`
            ALTER TABLE "customers"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from sales table
        await queryRunner.query(`
            ALTER TABLE "sales"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from sale_items table
        await queryRunner.query(`
            ALTER TABLE "sale_items"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from commissions table
        await queryRunner.query(`
            ALTER TABLE "commissions"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from commission_configs table
        await queryRunner.query(`
            ALTER TABLE "commission_configs"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from credit_sales table
        await queryRunner.query(`
            ALTER TABLE "credit_sales"
            DROP COLUMN "deleted_at"
        `);

        // Remove deleted_at column from credit_installments table
        await queryRunner.query(`
            ALTER TABLE "credit_installments"
            DROP COLUMN "deleted_at"
        `);
    }
}
