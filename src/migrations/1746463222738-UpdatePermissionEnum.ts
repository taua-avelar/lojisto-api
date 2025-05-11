import { MigrationInterface, QueryRunner } from "typeorm";
import { Permission } from "../common/entities/store-user-permission.entity";

export class UpdatePermissionEnum1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Obter todos os valores do enum Permission
        const permissionValues = Object.values(Permission).map(p => `'${p}'`).join(', ');
        
        // Criar um tipo temporário com todos os valores
        await queryRunner.query(`CREATE TYPE "permission_enum_new" AS ENUM (${permissionValues})`);
        
        // Alterar a coluna para usar o novo tipo
        await queryRunner.query(`
            ALTER TABLE "store_user_permissions" 
            ALTER COLUMN "permission" TYPE "permission_enum_new" 
            USING "permission"::text::"permission_enum_new"
        `);
        
        // Remover o tipo antigo
        await queryRunner.query(`DROP TYPE "permission_enum"`);
        
        // Renomear o novo tipo para o nome original
        await queryRunner.query(`ALTER TYPE "permission_enum_new" RENAME TO "permission_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Esta migração não pode ser revertida facilmente
        console.log('Esta migração não pode ser revertida');
    }
}