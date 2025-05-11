import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceiveCommissionsToStoreUsers1745999999999 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD COLUMN "receive_commissions" BOOLEAN NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            DROP COLUMN "receive_commissions"
        `);
    }
}
