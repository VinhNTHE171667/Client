import { MigrationInterface, QueryRunner } from "typeorm";

export class Loicute1760241887401 implements MigrationInterface {
    name = 'Loicute1760241887401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`doctor\` ADD \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`internal\` ADD \`gender\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`internal\` DROP COLUMN \`gender\``);
        await queryRunner.query(`ALTER TABLE \`doctor\` DROP COLUMN \`phone\``);
    }

}
