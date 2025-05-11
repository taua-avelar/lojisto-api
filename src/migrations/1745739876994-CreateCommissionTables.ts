import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommissionTables1745739876994 implements MigrationInterface {
    name = 'CreateCommissionTables1745739876994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create commission status enum
        await queryRunner.query(`CREATE TYPE "public"."commissions_status_enum" AS ENUM('pending', 'paid', 'canceled')`);

        // Create commissions table
        await queryRunner.query(`CREATE TABLE "commissions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "amount" numeric(10,2) NOT NULL,
            "rate" numeric(5,2) NOT NULL,
            "sale_total" numeric(10,2) NOT NULL,
            "status" "public"."commissions_status_enum" NOT NULL DEFAULT 'pending',
            "paid_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "store_id" uuid,
            "seller_id" uuid,
            "sale_id" uuid,
            CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id")
        )`);

        // Create commission_configs table
        await queryRunner.query(`CREATE TABLE "commission_configs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "rate" numeric(5,2) NOT NULL DEFAULT '5',
            "is_active" boolean NOT NULL DEFAULT true,
            "description" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "store_id" uuid,
            CONSTRAINT "PK_6becd5fd41501c9c827eb710b1f" PRIMARY KEY ("id")
        )`);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "idx_commissions_store_id" ON "commissions"("store_id")`);
        await queryRunner.query(`CREATE INDEX "idx_commissions_seller_id" ON "commissions"("seller_id")`);
        await queryRunner.query(`CREATE INDEX "idx_commissions_sale_id" ON "commissions"("sale_id")`);
        await queryRunner.query(`CREATE INDEX "idx_commissions_status" ON "commissions"("status")`);
        await queryRunner.query(`CREATE INDEX "idx_commission_configs_store_id" ON "commission_configs"("store_id")`);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "commissions" ADD CONSTRAINT "FK_082ba6517b71bec257467801ba3" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commissions" ADD CONSTRAINT "FK_1c57333eafb3addb87a892c582f" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commissions" ADD CONSTRAINT "FK_adfcd367c9c59984702fe86fb10" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_configs" ADD CONSTRAINT "FK_6f35850c277150abf902319788f" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "commission_configs" DROP CONSTRAINT "FK_6f35850c277150abf902319788f"`);
        await queryRunner.query(`ALTER TABLE "commissions" DROP CONSTRAINT "FK_adfcd367c9c59984702fe86fb10"`);
        await queryRunner.query(`ALTER TABLE "commissions" DROP CONSTRAINT "FK_1c57333eafb3addb87a892c582f"`);
        await queryRunner.query(`ALTER TABLE "commissions" DROP CONSTRAINT "FK_082ba6517b71bec257467801ba3"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_commissions_store_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_commissions_seller_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_commissions_sale_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_commissions_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_commission_configs_store_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "commission_configs"`);
        await queryRunner.query(`DROP TABLE "commissions"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE "public"."commissions_status_enum"`);
    }
}
