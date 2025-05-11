import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveGrantedColumn1746500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela store_user_permissions existe
        const tableExists = await queryRunner.hasTable("store_user_permissions");
        if (!tableExists) {
            console.log("Tabela store_user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a coluna granted existe
        const grantedExists = await queryRunner.hasColumn("store_user_permissions", "granted");
        if (!grantedExists) {
            console.log("Coluna granted não existe, pulando migração");
            return;
        }

        // Remover a coluna granted
        await queryRunner.query(`ALTER TABLE "store_user_permissions" DROP COLUMN "granted"`);
        console.log("Coluna granted removida com sucesso");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela store_user_permissions existe
        const tableExists = await queryRunner.hasTable("store_user_permissions");
        if (!tableExists) {
            console.log("Tabela store_user_permissions não existe, pulando migração");
            return;
        }

        // Verificar se a coluna granted já existe
        const grantedExists = await queryRunner.hasColumn("store_user_permissions", "granted");
        if (grantedExists) {
            console.log("Coluna granted já existe, pulando migração");
            return;
        }

        // Adicionar a coluna granted
        await queryRunner.query(`ALTER TABLE "store_user_permissions" ADD COLUMN "granted" BOOLEAN NOT NULL DEFAULT true`);
        console.log("Coluna granted adicionada com sucesso");
    }
}
