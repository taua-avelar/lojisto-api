import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1745023100002 implements MigrationInterface {
    name = 'CreateCategoriesTable1745023100002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar tabela de categorias
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "storeId" uuid,
                CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
            )
        `);

        // Adicionar chave estrangeira para a tabela de lojas
        await queryRunner.query(`
            ALTER TABLE "categories"
            ADD CONSTRAINT "FK_categories_store"
            FOREIGN KEY ("storeId")
            REFERENCES "stores"("id")
            ON DELETE CASCADE
        `);

        // Adicionar coluna categoryId na tabela de produtos
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD COLUMN "categoryId" uuid
        `);

        // Adicionar chave estrangeira para a tabela de categorias
        await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_products_category"
            FOREIGN KEY ("categoryId")
            REFERENCES "categories"("id")
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover chave estrangeira da tabela de produtos
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP CONSTRAINT "FK_products_category"
        `);

        // Remover coluna categoryId da tabela de produtos
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN "categoryId"
        `);

        // Remover chave estrangeira da tabela de categorias
        await queryRunner.query(`
            ALTER TABLE "categories"
            DROP CONSTRAINT "FK_categories_store"
        `);

        // Remover tabela de categorias
        await queryRunner.query(`
            DROP TABLE "categories"
        `);
    }
}
