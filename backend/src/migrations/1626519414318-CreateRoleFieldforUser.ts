import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateRoleFieldforUser1626519414318 implements MigrationInterface {
    name = 'CreateRoleFieldforUser1626519414318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM('0', '1', '2')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "users_role_enum" NOT NULL DEFAULT '2'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "users_role_enum"`);
    }

}
