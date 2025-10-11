import { MigrationInterface, QueryRunner } from "typeorm";

export class Loicute1760151102965 implements MigrationInterface {
    name = 'Loicute1760151102965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`doctor\` ADD \`refreshToken\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`doctor\` DROP COLUMN \`refreshToken\``);
    }

}
