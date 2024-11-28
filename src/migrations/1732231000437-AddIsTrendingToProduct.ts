import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsTrendingToProduct1732231000437 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "isTrending" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isTrending"`);
    }

}
