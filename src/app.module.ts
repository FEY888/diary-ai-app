import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DiaryModule } from './diary/diary.module';
import { DiaryAnalysisModule } from './diary_analysis/diary_analysis.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import typeorm from './config/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) => configService.getOrThrow('typeorm'),
    }),
    UsersModule,
    DiaryModule,
    DiaryAnalysisModule,
    AuthModule,
    AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
