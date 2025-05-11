import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserPermissionsTable1746452976214 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela user_permissions existe
        const tableExists = await queryRunner.hasTable("user_permissions");
        if (!tableExists) {
            console.log("Tabela user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a coluna store_user_id já existe
        const storeUserIdExists = await queryRunner.hasColumn("user_permissions", "store_user_id");
        if (storeUserIdExists) {
            console.log("Coluna store_user_id já existe, pulando migração");
            return;
        }

        // Verificar se as colunas user_id e store_id existem
        const userIdExists = await queryRunner.hasColumn("user_permissions", "user_id");
        const storeIdExists = await queryRunner.hasColumn("user_permissions", "store_id");

        if (!userIdExists || !storeIdExists) {
            console.log("Colunas user_id ou store_id não existem, pulando migração");
            return;
        }

        // Limpar a tabela de permissões para evitar problemas de integridade referencial
        await queryRunner.query(`TRUNCATE TABLE "user_permissions" CASCADE`);

        // Remover as restrições de chave estrangeira existentes
        try {
            await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_user"`);
        } catch (error) {
            console.log("Erro ao remover FK_user_permissions_user:", error.message);
        }

        try {
            await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_store"`);
        } catch (error) {
            console.log("Erro ao remover FK_user_permissions_store:", error.message);
        }

        // Adicionar a coluna store_user_id
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD "store_user_id" uuid`);

        // Adicionar a restrição de chave estrangeira para store_user_id
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_store_user" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE`);

        // Remover as colunas user_id e store_id
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP COLUMN "store_id"`);

        // Tornar store_user_id NOT NULL
        await queryRunner.query(`ALTER TABLE "user_permissions" ALTER COLUMN "store_user_id" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela user_permissions existe
        const tableExists = await queryRunner.hasTable("user_permissions");
        if (!tableExists) {
            console.log("Tabela user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a coluna store_user_id existe
        const storeUserIdExists = await queryRunner.hasColumn("user_permissions", "store_user_id");
        if (!storeUserIdExists) {
            console.log("Coluna store_user_id não existe, pulando migração");
            return;
        }

        // Limpar a tabela de permissões para evitar problemas de integridade referencial
        await queryRunner.query(`TRUNCATE TABLE "user_permissions" CASCADE`);

        // Remover a restrição de chave estrangeira existente
        try {
            await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT IF EXISTS "FK_user_permissions_store_user"`);
        } catch (error) {
            console.log("Erro ao remover FK_user_permissions_store_user:", error.message);
        }

        // Adicionar as colunas user_id e store_id
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD "store_id" uuid`);

        // Adicionar as restrições de chave estrangeira
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_user_permissions_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE`);

        // Tornar user_id e store_id NOT NULL
        await queryRunner.query(`ALTER TABLE "user_permissions" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ALTER COLUMN "store_id" SET NOT NULL`);

        // Remover a coluna store_user_id
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP COLUMN "store_user_id"`);
    }

}
