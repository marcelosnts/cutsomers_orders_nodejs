import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class DropProductColumnFromOrderProduct1603798120477
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders_products', 'product');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders_products',
      new TableColumn({ name: 'product', type: 'varchar' }),
    );
  }
}
