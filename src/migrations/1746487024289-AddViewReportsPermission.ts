import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViewReportsPermission1746487024289 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Esta migração é apenas um marcador para indicar que a permissão VIEW_REPORTS foi adicionada.
        // A atualização real do enum e a adição das permissões serão feitas manualmente ou
        // quando o aplicativo for reiniciado e o TypeORM sincronizar o esquema.
        console.log('Migração AddViewReportsPermission executada com sucesso.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Não há nada para reverter nesta migração
        console.log('Migração AddViewReportsPermission revertida com sucesso.');
    }

}
