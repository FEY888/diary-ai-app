import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReplyToDiaryAnalyses1795320593554 implements MigrationInterface {
    name = 'AddReplyToDiaryAnalyses1795320593554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diary_analyses" ADD "reply" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diary_analyses" DROP COLUMN "reply"`);
    }

}
