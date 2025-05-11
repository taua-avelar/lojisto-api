import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUserPermissionsTable1746462208319 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela user_permissions existe
        const tableExists = await queryRunner.hasTable("user_permissions");
        if (!tableExists) {
            console.log("Tabela user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a tabela store_user_permissions já existe
        const newTableExists = await queryRunner.hasTable("store_user_permissions");
        if (newTableExists) {
            console.log("Tabela store_user_permissions já existe, pulando migração");
            return;
        }

        // Renomear a tabela
        await queryRunner.query(`ALTER TABLE "user_permissions" RENAME TO "store_user_permissions"`);

        // Renomear a constraint de chave primária
        await queryRunner.query(`ALTER TABLE "store_user_permissions" RENAME CONSTRAINT "PK_user_permissions" TO "PK_store_user_permissions"`);

        // Renomear a constraint de chave estrangeira
        try {
            await queryRunner.query(`ALTER TABLE "store_user_permissions" RENAME CONSTRAINT "FK_user_permissions_store_user" TO "FK_store_user_permissions_store_user"`);
        } catch (error) {
            console.log("Erro ao renomear FK_user_permissions_store_user:", error.message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela store_user_permissions existe
        const tableExists = await queryRunner.hasTable("store_user_permissions");
        if (!tableExists) {
            console.log("Tabela store_user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a tabela user_permissions já existe
        const oldTableExists = await queryRunner.hasTable("user_permissions");
        if (oldTableExists) {
            console.log("Tabela user_permissions já existe, pulando migração");
            return;
        }

        // Renomear a constraint de chave estrangeira
        try {
            await queryRunner.query(`ALTER TABLE "store_user_permissions" RENAME CONSTRAINT "FK_store_user_permissions_store_user" TO "FK_user_permissions_store_user"`);
        } catch (error) {
            console.log("Erro ao renomear FK_store_user_permissions_store_user:", error.message);
        }

        // Renomear a constraint de chave primária
        await queryRunner.query(`ALTER TABLE "store_user_permissions" RENAME CONSTRAINT "PK_store_user_permissions" TO "PK_user_permissions"`);

        // Renomear a tabela
        await queryRunner.query(`ALTER TABLE "store_user_permissions" RENAME TO "user_permissions"`);
    }

}
