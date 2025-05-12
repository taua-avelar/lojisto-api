import { MigrationInterface, QueryRunner } from "typeorm";
import { Permission } from "../common/entities/store-user-permission.entity";

export class UpdatePermissionEnum1746463222738 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela store_user_permissions existe
        const tableExists = await queryRunner.hasTable("store_user_permissions");
        if (!tableExists) {
            console.log("Tabela store_user_permissions não existe, verificando tabela user_permissions");

            const oldTableExists = await queryRunner.hasTable("user_permissions");
            if (!oldTableExists) {
                console.log("Nenhuma tabela de permissões existe, pulando migração");
                return;
            } else {
                console.log("Usando tabela user_permissions em vez de store_user_permissions");
            }
        }

        // Obter todos os valores do enum Permission
        const permissionValues = Object.values(Permission).map(p => `'${p}'`).join(', ');

        try {
            // Criar um tipo temporário com todos os valores
            await queryRunner.query(`CREATE TYPE "permission_enum_new" AS ENUM (${permissionValues})`);

            // Alterar a coluna para usar o novo tipo
            const tableName = tableExists ? "store_user_permissions" : "user_permissions";
            await queryRunner.query(`
                ALTER TABLE "${tableName}"
                ALTER COLUMN "permission" TYPE "permission_enum_new"
                USING "permission"::text::"permission_enum_new"
            `);

            // Remover o tipo antigo
            await queryRunner.query(`DROP TYPE "permission_enum"`);

            // Renomear o novo tipo para o nome original
            await queryRunner.query(`ALTER TYPE "permission_enum_new" RENAME TO "permission_enum"`);
        } catch (error) {
            console.log("Erro ao atualizar enum de permissões:", error.message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Esta migração não pode ser revertida facilmente
        console.log('Esta migração não pode ser revertida');
    }
}