import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreditSalesTables1713058000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de crediários
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS credit_sales (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        remaining_amount DECIMAL(10, 2) NOT NULL,
        installments INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Criar tabela de parcelas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS credit_installments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        credit_sale_id UUID NOT NULL REFERENCES credit_sales(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        payment_date DATE,
        payment_method VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Criar índices para melhorar a performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_sales_store_id ON credit_sales(store_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_sales_customer_id ON credit_sales(customer_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_sales_status ON credit_sales(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_installments_credit_sale_id ON credit_installments(credit_sale_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_installments_status ON credit_installments(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_installments_due_date ON credit_installments(due_date)`);

    // Adicionar trigger para atualizar o updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Aplicar trigger para a tabela de crediários
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_credit_sales_updated_at ON credit_sales;
      CREATE TRIGGER update_credit_sales_updated_at
      BEFORE UPDATE ON credit_sales
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);

    // Aplicar trigger para a tabela de parcelas
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_credit_installments_updated_at ON credit_installments;
      CREATE TRIGGER update_credit_installments_updated_at
      BEFORE UPDATE ON credit_installments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_credit_installments_updated_at ON credit_installments`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_credit_sales_updated_at ON credit_sales`);
    
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_installments_due_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_installments_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_installments_credit_sale_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_sales_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_sales_customer_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_credit_sales_store_id`);
    
    // Remover tabelas
    await queryRunner.query(`DROP TABLE IF EXISTS credit_installments`);
    await queryRunner.query(`DROP TABLE IF EXISTS credit_sales`);
    
    // Remover função
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
  }
}
