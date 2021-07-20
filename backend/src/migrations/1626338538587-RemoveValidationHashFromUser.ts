import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveValidationHashFromUser1626338538587 implements MigrationInterface {
    name = 'RemoveValidationHashFromUser1626338538587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "validationHash"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "validationHash" character varying`);
    }

}
