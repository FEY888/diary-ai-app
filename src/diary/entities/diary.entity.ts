import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "../../users/entities/user.entity";
import { DiaryAnalysis } from "../../diary_analysis/entities/diary_analysis.entity";
import { Exclude } from "class-transformer";

@Entity('diaries')
export class Diary {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'varchar',
        length: 100,
    })
    title!: string;

    @Column({
        type: 'text'
    })
    content!: string;

    @Column({
        type: 'date'
    })
    diaryDate!: string;

    @Exclude()
    @ManyToOne(() => Users,(user) => user.diaries, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    user!: Users;

    @OneToOne(() => DiaryAnalysis, (diaryAnalysis) => diaryAnalysis.diary)
    diaryAnalysis!: DiaryAnalysis;

    @CreateDateColumn({
        type: 'timestamp'
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type: 'timestamp'
    })
    updatedAt!: Date;

}