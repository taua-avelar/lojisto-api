import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowNullPaymentMethod1746082511718 implements MigrationInterface {
    name = 'AllowNullPaymentMethod1746082511718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Permitir valores nulos no campo payment_method
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurar a restrição NOT NULL
        await queryRunner.query(`ALTER TABLE "sales" ALTER COLUMN "payment_method" SET NOT NULL`);
    }
}
