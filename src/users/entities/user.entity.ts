import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Diary } from "../../diary/entities/diary.entity";
import { RolesEnum } from "../enum/roles-enum";
import { Exclude } from "class-transformer";

@Entity('users')
export class Users {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    email!: string;

    @Column({
        type: 'varchar',
        length:30,
        nullable: false,
    })
    nickname!: string;

    @Exclude()
    @Column({
        type: 'varchar',
        length:255,
    })
    password!: string;

    @Column({
        type: 'enum',
        enum: RolesEnum,
        default: RolesEnum.USER
    })
    role!: RolesEnum;

    @OneToMany(() => Diary, (diary) => diary.user )
    diaries!: Diary[];

    @CreateDateColumn({
        type: 'timestamp'
    })
    createdAt!: Date;

    @UpdateDateColumn({
        type:'timestamp'
    })
    updatedAt!: Date;

    @Exclude()
    @Column({
        type: 'varchar',
        length:255,
        nullable: true
    })
    refreshTokenHash!: string | null;
}