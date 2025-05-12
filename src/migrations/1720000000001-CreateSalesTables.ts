import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSalesTables1745023100003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de vendas
    await queryRunner.createTable(
      new Table({
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'date',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'paymentMethod',
            type: 'enum',
            enum: ['credit', 'debit', 'cash', 'pix'],
            default: "'credit'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'canceled'],
            default: "'completed'",
          },
          {
            name: 'customerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'storeId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Criar tabela de itens de venda
    await queryRunner.createTable(
      new Table({
        name: 'sale_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'saleId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Adicionar chaves estrangeiras
    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['storeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'stores',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['saleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover chaves estrangeiras
    const saleItemsTable = await queryRunner.getTable('sale_items');
    if (saleItemsTable) {
      const saleIdForeignKey = saleItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('saleId') !== -1,
      );
      if (saleIdForeignKey) {
        await queryRunner.dropForeignKey('sale_items', saleIdForeignKey);
      }

      const productIdForeignKey = saleItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('productId') !== -1,
      );
      if (productIdForeignKey) {
        await queryRunner.dropForeignKey('sale_items', productIdForeignKey);
      }
    }

    const salesTable = await queryRunner.getTable('sales');
    if (salesTable) {
      const customerIdForeignKey = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('customerId') !== -1,
      );
      if (customerIdForeignKey) {
        await queryRunner.dropForeignKey('sales', customerIdForeignKey);
      }

      const storeIdForeignKey = salesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('storeId') !== -1,
      );
      if (storeIdForeignKey) {
        await queryRunner.dropForeignKey('sales', storeIdForeignKey);
      }
    }

    // Remover tabelas
    await queryRunner.dropTable('sale_items');
    await queryRunner.dropTable('sales');
  }
}
