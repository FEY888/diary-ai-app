import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiaryUserDiaryDateIndex1791653488772 implements MigrationInterface {
    name = 'AddDiaryUserDiaryDateIndex1791653488772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_diaries_user_diary_date" ON "diaries"  ("userId", "diaryDate") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_diaries_user_diary_date"`);
    }

}
