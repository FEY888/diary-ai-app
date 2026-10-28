import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnalysisStartedAt1793200969857 implements MigrationInterface {
    name = 'AddAnalysisStartedAt1793200969857'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaries" ADD "analysisStartedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaries" DROP COLUMN "analysisStartedAt"`);
    }

}
