import { MigrationInterface, QueryRunner } from "typeorm";

export class Loicute1759914930242 implements MigrationInterface {
    name = 'Loicute1759914930242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`voucher\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`discountAmount\` decimal(10,2) NULL, \`discountPercent\` decimal(5,2) NULL, \`maxDiscount\` decimal(10,2) NULL, \`validFrom\` timestamp NULL, \`validTo\` timestamp NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_73e3d2a7719851716e94083698\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`spa\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`deletedAt\` datetime(6) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`doctor\` (\`id\` varchar(36) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`gender\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`biography\` varchar(255) NULL, \`specialization\` varchar(255) NOT NULL, \`experience_years\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_bf6303ac911efaab681dc911f5\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`service\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`images\` json NOT NULL, \`description\` varchar(255) NULL, \`categoryId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cart_detail\` (\`id\` varchar(36) NOT NULL, \`cartId\` varchar(255) NOT NULL, \`serviceId\` varchar(255) NOT NULL, \`quantity\` int NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cart\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointment_detail\` (\`id\` varchar(36) NOT NULL, \`appointmentId\` varchar(255) NOT NULL, \`serviceId\` varchar(255) NOT NULL, \`quantity\` int NOT NULL DEFAULT '1', \`price\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`internal\` (\`id\` varchar(36) NOT NULL, \`avatar\` varchar(255) NULL, \`full_name\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`refreshToken\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`roleId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointment_history\` (\`id\` varchar(36) NOT NULL, \`appointmentId\` varchar(255) NOT NULL, \`oldStatus\` enum ('pending', 'confirmed', 'completed', 'cancelled') NOT NULL, \`newStatus\` enum ('pending', 'confirmed', 'completed', 'cancelled') NOT NULL, \`note\` varchar(255) NULL, \`reason\` varchar(255) NULL, \`changedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`changedByStaffId\` varchar(36) NULL, \`changedByCustomerId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointment\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`doctorId\` varchar(255) NULL, \`appointment_date\` timestamp NOT NULL, \`status\` enum ('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`voucherId\` varchar(255) NULL, \`cancelledAt\` datetime NULL, \`cancelReason\` varchar(255) NULL, \`startTime\` timestamp NOT NULL, \`endTime\` timestamp NOT NULL, \`note\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_detail\` (\`id\` varchar(36) NOT NULL, \`invoiceId\` varchar(255) NOT NULL, \`serviceId\` varchar(255) NOT NULL, \`quantity\` int NOT NULL DEFAULT '1', \`price\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`appointmentId\` varchar(255) NOT NULL, \`total_amount\` decimal(10,2) NOT NULL, \`status\` enum ('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending', \`payment_status\` enum ('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid', \`payment_method\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`voucherId\` varchar(255) NULL, \`total\` decimal(10,2) NOT NULL, \`discount\` decimal(10,2) NOT NULL, \`finalAmount\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`customer_voucher\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`voucherId\` varchar(255) NOT NULL, \`isUsed\` tinyint NOT NULL DEFAULT 0, \`usedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`customer\` (\`id\` varchar(36) NOT NULL, \`avatar\` varchar(255) NULL, \`full_name\` varchar(255) NOT NULL, \`gender\` enum ('male', 'female', 'other') NOT NULL DEFAULT 'male', \`birth_date\` date NULL, \`password\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`isVerified\` tinyint NOT NULL DEFAULT 0, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`address\` varchar(255) NULL, \`customer_type\` enum ('regular', 'member', 'vip') NOT NULL DEFAULT 'regular', \`total_spent\` decimal(10,2) NOT NULL DEFAULT '0.00', \`refreshToken\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`membershipId\` varchar(255) NULL, UNIQUE INDEX \`IDX_fdb2f3ad8115da4c7718109a6e\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`membership\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`minSpent\` decimal(10,2) NOT NULL, \`maxSpent\` decimal(10,2) NULL, \`discountPercent\` decimal(5,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`doctor_services_service\` (\`doctorId\` varchar(36) NOT NULL, \`serviceId\` varchar(36) NOT NULL, INDEX \`IDX_6a33991fca20b84269dc0ca32d\` (\`doctorId\`), INDEX \`IDX_6ad06b4880e3af4c6f0d0cf693\` (\`serviceId\`), PRIMARY KEY (\`doctorId\`, \`serviceId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`service\` ADD CONSTRAINT \`FK_cb169715cbb8c74f263ba192ca8\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_detail\` ADD CONSTRAINT \`FK_bb824f8fd0054ecb1c1cc9a7a46\` FOREIGN KEY (\`cartId\`) REFERENCES \`cart\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_detail\` ADD CONSTRAINT \`FK_c132b9facf332001ff213584920\` FOREIGN KEY (\`serviceId\`) REFERENCES \`service\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart\` ADD CONSTRAINT \`FK_eac3d1f269ffeb0999fbde0185b\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_detail\` ADD CONSTRAINT \`FK_54d5775e520aa01cfd3cf0f91c6\` FOREIGN KEY (\`appointmentId\`) REFERENCES \`appointment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_detail\` ADD CONSTRAINT \`FK_d747a54b3256840ee2573306d6f\` FOREIGN KEY (\`serviceId\`) REFERENCES \`service\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`internal\` ADD CONSTRAINT \`FK_eedf21126b848f50964ef403c05\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` ADD CONSTRAINT \`FK_e0d3d59296667927a1ee5dec527\` FOREIGN KEY (\`appointmentId\`) REFERENCES \`appointment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` ADD CONSTRAINT \`FK_4403cfa08cd458a6374ee13f615\` FOREIGN KEY (\`changedByStaffId\`) REFERENCES \`internal\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` ADD CONSTRAINT \`FK_21500f411773e3979d6415ed7ae\` FOREIGN KEY (\`changedByCustomerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_c048c6004b69354f46183f93a85\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_514bcc3fb1b8140f85bf1cde6e2\` FOREIGN KEY (\`doctorId\`) REFERENCES \`doctor\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_5317ffc2e97a7652acda9630fa2\` FOREIGN KEY (\`voucherId\`) REFERENCES \`voucher\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_detail\` ADD CONSTRAINT \`FK_d4843ef5fb0acb6a1ea470236c6\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_detail\` ADD CONSTRAINT \`FK_4edf232e5922cbca25f4b1883c1\` FOREIGN KEY (\`serviceId\`) REFERENCES \`service\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_925aa26ea12c28a6adb614445ee\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_150d4d66fbf46ada8965e14294f\` FOREIGN KEY (\`appointmentId\`) REFERENCES \`appointment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_d6efce98aea4ccb56af03582e55\` FOREIGN KEY (\`voucherId\`) REFERENCES \`voucher\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_voucher\` ADD CONSTRAINT \`FK_879e87c9645a9c91184b111ebda\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_voucher\` ADD CONSTRAINT \`FK_cd7d2f5f365f9c202ebea88f454\` FOREIGN KEY (\`voucherId\`) REFERENCES \`voucher\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer\` ADD CONSTRAINT \`FK_dd384f17a2b3d546f7c1d497a5f\` FOREIGN KEY (\`membershipId\`) REFERENCES \`membership\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`doctor_services_service\` ADD CONSTRAINT \`FK_6a33991fca20b84269dc0ca32dd\` FOREIGN KEY (\`doctorId\`) REFERENCES \`doctor\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`doctor_services_service\` ADD CONSTRAINT \`FK_6ad06b4880e3af4c6f0d0cf6930\` FOREIGN KEY (\`serviceId\`) REFERENCES \`service\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`doctor_services_service\` DROP FOREIGN KEY \`FK_6ad06b4880e3af4c6f0d0cf6930\``);
        await queryRunner.query(`ALTER TABLE \`doctor_services_service\` DROP FOREIGN KEY \`FK_6a33991fca20b84269dc0ca32dd\``);
        await queryRunner.query(`ALTER TABLE \`customer\` DROP FOREIGN KEY \`FK_dd384f17a2b3d546f7c1d497a5f\``);
        await queryRunner.query(`ALTER TABLE \`customer_voucher\` DROP FOREIGN KEY \`FK_cd7d2f5f365f9c202ebea88f454\``);
        await queryRunner.query(`ALTER TABLE \`customer_voucher\` DROP FOREIGN KEY \`FK_879e87c9645a9c91184b111ebda\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_d6efce98aea4ccb56af03582e55\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_150d4d66fbf46ada8965e14294f\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_925aa26ea12c28a6adb614445ee\``);
        await queryRunner.query(`ALTER TABLE \`invoice_detail\` DROP FOREIGN KEY \`FK_4edf232e5922cbca25f4b1883c1\``);
        await queryRunner.query(`ALTER TABLE \`invoice_detail\` DROP FOREIGN KEY \`FK_d4843ef5fb0acb6a1ea470236c6\``);
        await queryRunner.query(`ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_5317ffc2e97a7652acda9630fa2\``);
        await queryRunner.query(`ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_514bcc3fb1b8140f85bf1cde6e2\``);
        await queryRunner.query(`ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_c048c6004b69354f46183f93a85\``);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` DROP FOREIGN KEY \`FK_21500f411773e3979d6415ed7ae\``);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` DROP FOREIGN KEY \`FK_4403cfa08cd458a6374ee13f615\``);
        await queryRunner.query(`ALTER TABLE \`appointment_history\` DROP FOREIGN KEY \`FK_e0d3d59296667927a1ee5dec527\``);
        await queryRunner.query(`ALTER TABLE \`internal\` DROP FOREIGN KEY \`FK_eedf21126b848f50964ef403c05\``);
        await queryRunner.query(`ALTER TABLE \`appointment_detail\` DROP FOREIGN KEY \`FK_d747a54b3256840ee2573306d6f\``);
        await queryRunner.query(`ALTER TABLE \`appointment_detail\` DROP FOREIGN KEY \`FK_54d5775e520aa01cfd3cf0f91c6\``);
        await queryRunner.query(`ALTER TABLE \`cart\` DROP FOREIGN KEY \`FK_eac3d1f269ffeb0999fbde0185b\``);
        await queryRunner.query(`ALTER TABLE \`cart_detail\` DROP FOREIGN KEY \`FK_c132b9facf332001ff213584920\``);
        await queryRunner.query(`ALTER TABLE \`cart_detail\` DROP FOREIGN KEY \`FK_bb824f8fd0054ecb1c1cc9a7a46\``);
        await queryRunner.query(`ALTER TABLE \`service\` DROP FOREIGN KEY \`FK_cb169715cbb8c74f263ba192ca8\``);
        await queryRunner.query(`DROP INDEX \`IDX_6ad06b4880e3af4c6f0d0cf693\` ON \`doctor_services_service\``);
        await queryRunner.query(`DROP INDEX \`IDX_6a33991fca20b84269dc0ca32d\` ON \`doctor_services_service\``);
        await queryRunner.query(`DROP TABLE \`doctor_services_service\``);
        await queryRunner.query(`DROP TABLE \`membership\``);
        await queryRunner.query(`DROP INDEX \`IDX_fdb2f3ad8115da4c7718109a6e\` ON \`customer\``);
        await queryRunner.query(`DROP TABLE \`customer\``);
        await queryRunner.query(`DROP TABLE \`customer_voucher\``);
        await queryRunner.query(`DROP TABLE \`invoice\``);
        await queryRunner.query(`DROP TABLE \`invoice_detail\``);
        await queryRunner.query(`DROP TABLE \`appointment\``);
        await queryRunner.query(`DROP TABLE \`appointment_history\``);
        await queryRunner.query(`DROP TABLE \`internal\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``);
        await queryRunner.query(`DROP TABLE \`role\``);
        await queryRunner.query(`DROP TABLE \`appointment_detail\``);
        await queryRunner.query(`DROP TABLE \`cart\``);
        await queryRunner.query(`DROP TABLE \`cart_detail\``);
        await queryRunner.query(`DROP TABLE \`service\``);
        await queryRunner.query(`DROP INDEX \`IDX_bf6303ac911efaab681dc911f5\` ON \`doctor\``);
        await queryRunner.query(`DROP TABLE \`doctor\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`spa\``);
        await queryRunner.query(`DROP INDEX \`IDX_73e3d2a7719851716e94083698\` ON \`voucher\``);
        await queryRunner.query(`DROP TABLE \`voucher\``);
    }

}
