import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNoneToPaymentMethod1746082280404 implements MigrationInterface {
    name = 'AddNoneToPaymentMethod1746082280404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Renomear o enum existente
        await queryRunner.query(`ALTER TYPE "public"."sales_paymentmethod_enum" RENAME TO "sales_paymentmethod_enum_old"`);

        // Criar o novo enum com a opção 'none'
        await queryRunner.query(`CREATE TYPE "public"."sales_payment_method_enum" AS ENUM('none', 'credit', 'debit', 'cash', 'pix', 'credit_sale')`);

        // Alterar a coluna para usar o novo enum
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" TYPE "public"."sales_payment_method_enum" USING "payment_method"::"text"::"public"."sales_payment_method_enum"`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" SET DEFAULT 'credit'`);

        // Remover o enum antigo
        await queryRunner.query(`DROP TYPE "public"."sales_paymentmethod_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Renomear o enum existente
        await queryRunner.query(`ALTER TYPE "public"."sales_payment_method_enum" RENAME TO "sales_payment_method_enum_old"`);

        // Criar o enum antigo sem a opção 'none'
        await queryRunner.query(`CREATE TYPE "public"."sales_paymentmethod_enum" AS ENUM('credit', 'debit', 'cash', 'pix', 'credit_sale')`);

        // Alterar a coluna para usar o enum antigo
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" TYPE "public"."sales_paymentmethod_enum" USING "payment_method"::"text"::"public"."sales_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" SET DEFAULT 'credit'`);

        // Remover o enum novo
        await queryRunner.query(`DROP TYPE "public"."sales_payment_method_enum_old"`);
    }
}
