import {MigrationInterface, QueryRunner} from "typeorm";

export class addUsersValidationHash1625229400017 implements MigrationInterface {
    name = 'addUsersValidationHash1625229400017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "validationHash" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "validationHash"`);
    }

}
