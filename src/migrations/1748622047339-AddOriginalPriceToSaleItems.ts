import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOriginalPriceToSaleItems1746600000000 implements MigrationInterface {
    name = 'AddOriginalPriceToSaleItems1746600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna original_price à tabela sale_items
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            ADD COLUMN "original_price" DECIMAL(10, 2) NOT NULL DEFAULT 0
        `);

        // Atualizar valores existentes para que original_price seja igual a price
        await queryRunner.query(`
            UPDATE "sale_items" 
            SET "original_price" = "price"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna original_price da tabela sale_items
        await queryRunner.query(`
            ALTER TABLE "sale_items" 
            DROP COLUMN "original_price"
        `);
    }
}