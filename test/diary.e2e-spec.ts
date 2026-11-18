import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import Redis from 'ioredis';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/ai/ai.service';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { TokenResponseDto } from '../src/auth/dto/token-response.dto';

const TEST_DATABASE = 'diary_test';

describe('Diary E2e', () => {
  let app: INestApplication;
  let accessToken: string;

  const email = `e2e-${Date.now()}@test.com`;
  const password = 'test1234';
  const diary = { title: '테스트', content: '본문', diaryDate: '2026-11-17' };

  beforeAll(async () => {
    // 테스트 DB가 아니면 중단
    if (process.env.DB_DATABASE !== TEST_DATABASE) {
      throw new Error(`E2E 테스트는 ${TEST_DATABASE}에서만 실행됩니다. 
                현재 : ${process.env.DB_DATABASE}`);
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiService)
      .useValue({
        analyzeDiary: async () => ({
          summary: '요약',
          primaryEmotion: '기쁨',
          keywords: [],
          concerns: [],
          needs: [],
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // 회원가입
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, nickname: '테스터', password })
      .expect(201);

    // 로그인(토큰 받기)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);
    accessToken = (loginResponse.body as TokenResponseDto).accessToken;
  });

  afterAll(async () => {
    await app.get<Redis>(REDIS_CLIENT).quit();
    await app.close();
  });

  it('로그인하면 accessToken 발급', async () => {
    expect(accessToken).toBeDefined();
  });

  it('같은 이메일로 다시 회원가입하면 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, nickname: '테스터', password })
      .expect(409);
  });

  it('발급받은 토큰 없이 다이어리 작성하는 경우 401', async () => {
    await request(app.getHttpServer()).post('/diaries').send(diary).expect(401);
  });

  it('발급받은 토큰이 있고 다이어리 작성하는 경우', async () => {
    await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(diary)
      .expect(201);
  });
});
