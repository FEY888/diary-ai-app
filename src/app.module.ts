import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DiaryModule } from './diary/diary.module';
import { DiaryAnalysisModule } from './diary_analysis/diary_analysis.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import typeorm from './config/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './common/exception-filter/http.exception-filter';
import { LogMiddleware } from './common/log_middleware/log.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getOrThrow('typeorm'),
    }),
    UsersModule,
    DiaryModule,
    DiaryAnalysisModule,
    AuthModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).exclude('api', 'api/*splat').forRoutes('*');
  }
}
