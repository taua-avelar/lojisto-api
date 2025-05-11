import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoresAndStoreUsersTables1745023000000 implements MigrationInterface {
    name = 'CreateStoresAndStoreUsersTables1745023000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar o tipo enum para os papéis de usuário na loja
        await queryRunner.query(`CREATE TYPE "store_role_enum" AS ENUM('owner', 'seller')`);

        // Criar a tabela de lojas
        await queryRunner.query(`
            CREATE TABLE "stores" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "address" character varying NOT NULL,
                "phone" character varying,
                "email" character varying,
                "logo" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_stores" PRIMARY KEY ("id")
            )
        `);

        // Criar a tabela de junção entre lojas e usuários
        await queryRunner.query(`
            CREATE TABLE "store_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "role" "store_role_enum" NOT NULL DEFAULT 'seller',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid,
                "store_id" uuid,
                CONSTRAINT "PK_store_users" PRIMARY KEY ("id")
            )
        `);

        // Adicionar chaves estrangeiras
        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "FK_store_users_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "store_users" 
            ADD CONSTRAINT "FK_store_users_store" 
            FOREIGN KEY ("store_id") REFERENCES "stores"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover chaves estrangeiras
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_store_users_store"`);
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_store_users_user"`);
        
        // Remover tabelas
        await queryRunner.query(`DROP TABLE "store_users"`);
        await queryRunner.query(`DROP TABLE "stores"`);
        
        // Remover o tipo enum
        await queryRunner.query(`DROP TYPE "store_role_enum"`);
    }
}
