import { MigrationInterface, QueryRunner } from "typeorm";

export class FixViewReportsPermission1746600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se o valor já existe no enum para evitar erros
        const checkResult = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'view_reports' 
                AND enumtypid = (
                    SELECT oid FROM pg_type WHERE typname = 'permission_enum'
                )
            ) as exists
        `);
        
        const valueExists = checkResult[0].exists;
        
        if (!valueExists) {
            // Desabilitar temporariamente as transações para permitir a alteração do enum
            await queryRunner.query('COMMIT');
            
            // Adicionar o valor 'view_reports' ao enum permission_enum
            await queryRunner.query(`ALTER TYPE permission_enum ADD VALUE 'view_reports'`);
            
            // Iniciar uma nova transação
            await queryRunner.query('BEGIN');
            
            console.log("Valor 'view_reports' adicionado ao enum permission_enum com sucesso");
        } else {
            console.log("Valor 'view_reports' já existe no enum permission_enum, pulando");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Não é possível remover valores de um enum no PostgreSQL sem recriar o tipo
        console.log("Não é possível remover valores de um enum no PostgreSQL sem recriar o tipo");
    }
}
