import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1790704167958 implements MigrationInterface {
    name = 'InitialMigration1790704167958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "nickname" character varying(30) NOT NULL, "password" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "diary_analyses" ("id" SERIAL NOT NULL, "summary" text NOT NULL, "primaryEmotion" character varying(50) NOT NULL, "keywords" jsonb, "needs" jsonb, "concerns" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "diaryId" integer NOT NULL, CONSTRAINT "REL_9da0ada9b818460b18a053dadd" UNIQUE ("diaryId"), CONSTRAINT "PK_37bbeb6aea17fe76cbb641b98a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "diaries" ("id" SERIAL NOT NULL, "title" character varying(100) NOT NULL, "content" text NOT NULL, "diaryDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_ffd738e7d40dcfa59283dcaae87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "diary_analyses" ADD CONSTRAINT "FK_9da0ada9b818460b18a053daddf" FOREIGN KEY ("diaryId") REFERENCES "diaries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diaries" ADD CONSTRAINT "FK_6454969d8c037fee60374c8527c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaries" DROP CONSTRAINT "FK_6454969d8c037fee60374c8527c"`);
        await queryRunner.query(`ALTER TABLE "diary_analyses" DROP CONSTRAINT "FK_9da0ada9b818460b18a053daddf"`);
        await queryRunner.query(`DROP TABLE "diaries"`);
        await queryRunner.query(`DROP TABLE "diary_analyses"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
