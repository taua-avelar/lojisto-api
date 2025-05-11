import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoreConfigTable1746042619845 implements MigrationInterface {
    name = 'CreateStoreConfigTable1746042619845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela já existe
        const tableExists = await queryRunner.hasTable('store_configs');
        if (!tableExists) {
            // Criar a tabela store_configs
            await queryRunner.query(`
                CREATE TABLE "store_configs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "store_id" uuid NOT NULL,
                    "low_stock_threshold" integer NOT NULL DEFAULT 10,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "is_deleted" boolean NOT NULL DEFAULT false,
                    CONSTRAINT "PK_store_configs" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_store_configs_store_id" UNIQUE ("store_id"),
                    CONSTRAINT "FK_store_configs_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION
                )
            `);

            // Criar índice para melhorar a performance
            await queryRunner.query(`CREATE INDEX "idx_store_configs_store_id" ON "store_configs" ("store_id")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover a tabela store_configs
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_store_configs_store_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "store_configs"`);
    }
}
