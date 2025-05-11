import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDownPaymentToCreditSales1745472760005 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna down_payment à tabela credit_sales
        await queryRunner.query(`
            ALTER TABLE credit_sales
            ADD COLUMN IF NOT EXISTS down_payment DECIMAL(10, 2) DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover coluna down_payment da tabela credit_sales
        await queryRunner.query(`
            ALTER TABLE credit_sales
            DROP COLUMN IF EXISTS down_payment
        `);
    }

}
