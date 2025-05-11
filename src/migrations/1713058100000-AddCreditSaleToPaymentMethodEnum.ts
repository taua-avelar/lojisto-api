import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditSaleToPaymentMethodEnum1713058100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Desabilitar temporariamente as transações para permitir a alteração do enum
    await queryRunner.query('COMMIT');

    // Adicionar o valor 'credit_sale' ao enum sales_paymentmethod_enum
    await queryRunner.query(`ALTER TYPE sales_paymentmethod_enum ADD VALUE 'credit_sale';`);

    // Iniciar uma nova transação
    await queryRunner.query('BEGIN');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Não é possível remover valores de um enum no PostgreSQL sem recriar o tipo
    // Essa operação é complexa e pode causar perda de dados, então não implementamos
    console.log('Downgrade não implementado para esta migração');
  }
}
