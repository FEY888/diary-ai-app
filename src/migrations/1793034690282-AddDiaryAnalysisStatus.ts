import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiaryAnalysisStatus1793034690282 implements MigrationInterface {
    name = 'AddDiaryAnalysisStatus1793034690282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaries" ADD "analysisStatus" character varying(20) NOT NULL DEFAULT 'IDLE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaries" DROP COLUMN "analysisStatus"`);
    }

}
