import {MigrationInterface, QueryRunner} from "typeorm";

export class adduserStatus1625227907066 implements MigrationInterface {
    name = 'adduserStatus1625227907066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "users_status_enum" AS ENUM('active', 'disabled', 'pending')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "users_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "users_status_enum"`);
    }

}
