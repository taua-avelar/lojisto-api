import { MigrationInterface, QueryRunner } from "typeorm";
import { Permission } from "../common/entities/store-user-permission.entity";

export class CreateUserPermissionsTable1746367366234 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enum de permissões
        await queryRunner.query(`CREATE TYPE "permission_enum" AS ENUM (${Object.values(Permission).map(p => `'${p}'`).join(', ')})`);

        // Criar tabela de permissões
        await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "store_user_id" uuid NOT NULL,
                "permission" "permission_enum" NOT NULL,
                "granted" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_permissions_store_user" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_permissions"`);
        await queryRunner.query(`DROP TYPE "permission_enum"`);
    }

}
