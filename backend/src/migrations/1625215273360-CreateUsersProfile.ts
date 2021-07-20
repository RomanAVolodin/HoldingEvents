import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUsersProfile1625215273360 implements MigrationInterface {
    name = 'CreateUsersProfile1625215273360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profileFirstname" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profileLastname" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileLastname"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileFirstname"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "image" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying NOT NULL DEFAULT ''`);
    }

}
