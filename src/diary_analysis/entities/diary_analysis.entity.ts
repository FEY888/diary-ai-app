import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Diary } from "../../diary/entities/diary.entity";

@Entity('diary_analyses')
export class DiaryAnalysis {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'text'
    })
    summary!: string;

    @Column({
        type: 'varchar',
        length:50,
    })
    primaryEmotion!: string;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    keywords!: string[] | null;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    needs!: string[] | null;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    concerns!: string[] | null;

    @OneToOne(() => Diary, (diary) =>diary.diaryAnalysis, {
        nullable:false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    diary!:Diary;

    

    @CreateDateColumn({
        type: 'timestamp'
    })
    createdAt!: Date;
    

}