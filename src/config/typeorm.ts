import {registerAs} from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'local'}`,
});

const config: any= {
    type: 'postgres',
    host: `${process.env.DB_HOST || 'localhost'}`,
    port: Number(`${process.env.DB_PORT || 5439}`),
    username: `${process.env.DB_USERNAME || 'diary'}`,
    password: `${process.env.DB_PASSWORD || 'diary'}`,
    database: `${process.env.DB_DATABASE || 'diary_service'}`,
    entities: ['dist/**/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: false,

    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
    } : false,
};





export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);