import { MigrationInterface, QueryRunner } from "typeorm";

export class Loicute1759414475319 implements MigrationInterface {
    name = 'Loicute1759414475319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`customer\` (\`id\` varchar(36) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`gender\` enum ('male', 'female', 'other') NOT NULL DEFAULT 'male', \`birth_date\` date NULL, \`password\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`isVerified\` tinyint NOT NULL DEFAULT 0, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`address\` varchar(255) NULL, \`customer_type\` enum ('regular', 'member', 'vip') NOT NULL DEFAULT 'regular', \`total_spent\` decimal(10,2) NOT NULL DEFAULT '0.00', \`refreshToken\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_fdb2f3ad8115da4c7718109a6e\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`refreshToken\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5e568e001f9d1b91f67815c580\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_5e568e001f9d1b91f67815c580\` ON \`admin\``);
        await queryRunner.query(`DROP TABLE \`admin\``);
        await queryRunner.query(`DROP INDEX \`IDX_fdb2f3ad8115da4c7718109a6e\` ON \`customer\``);
        await queryRunner.query(`DROP TABLE \`customer\``);
    }

}
