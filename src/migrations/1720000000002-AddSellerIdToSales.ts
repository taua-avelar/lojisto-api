import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddSellerIdToSales1720000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna seller_id na tabela sales
    await queryRunner.addColumn(
      'sales',
      new TableColumn({
        name: 'seller_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adicionar chave estrangeira para a tabela users
    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['seller_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover a chave estrangeira
    const table = await queryRunner.getTable('sales');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('seller_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('sales', foreignKey);
      }
    }

    // Remover a coluna
    await queryRunner.dropColumn('sales', 'seller_id');
  }
}
