import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1745023100000 implements MigrationInterface {
    name = 'CreateProductsTable1745023100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "price" decimal(10,2) NOT NULL,
                "cost" decimal(10,2) NOT NULL DEFAULT '0',
                "stock" integer NOT NULL DEFAULT '0',
                "sku" character varying,
                "barcode" character varying,
                "image" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "storeId" uuid,
                CONSTRAINT "PK_products" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_store" 
            FOREIGN KEY ("storeId") REFERENCES "stores"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_store"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }
}
