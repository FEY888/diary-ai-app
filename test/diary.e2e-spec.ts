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
import { DiaryResponseDto } from '../src/diary/dto/diary-response.dto';
import { DiaryAnalysisResponseDto } from '../src/diary_analysis/dto/response.dto';

const TEST_DATABASE = 'diary_test';
const expectedReply = '본문 내용 분석 답변';

describe('Diary E2e', () => {
  let app: INestApplication;
  let accessToken: string;

  const email = `e2e-${Date.now()}@test.com`;
  const password = 'test1234';
  const diary = { title: '테스트', content: '본문', diaryDate: '2026-11-17' };

  beforeAll(async () => {
    // 테스트 DB가 아니면 중단
    if (process.env.DB_DATABASE !== TEST_DATABASE) {
      throw new Error(
        `E2E 테스트는 ${TEST_DATABASE}에서만 실행됩니다. 현재 : ${process.env.DB_DATABASE}`,
      );
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiService)
      .useValue({
        analyzeDiary: async () => ({
          summary: '요약',
          reply: expectedReply,
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

  it('로그인하면 accessToken 발급', () => {
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

  it('발급받은 토큰이 있고 다이어리 작성하는 경우 201', async () => {
    await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(diary)
      .expect(201);
  });

  it('달력에 없는 날짜로 다이어리 작성하면 400', async () => {
    await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '날짜 테스트', content: '본문', diaryDate: '2026-02-30' })
      .expect(400);
  });

  it('같은 날짜에 다이어리를 두 개 작성하면 두 번째는 409', async () => {
    const sameDiaryDate = {
      title: '중복 테스트',
      content: '본문',
      diaryDate: '2026-10-29',
    };

    // 첫 번째 다이어리 작성은 성공
    await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(sameDiaryDate)
      .expect(201);

    // 같은 날짜에 또 작성 시 거절
    await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(sameDiaryDate)
      .expect(409);
  });

  it('다른 사람의 다이어리를 조회하면 404', async () => {
    // 다른 사용자(B) 회원가입 + 로그인
    const otherEmail = `e2e-other-${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: otherEmail, nickname: '다른 사용자', password })
      .expect(201);

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: otherEmail, password })
      .expect(200);
    const otherAccessToken = (otherLoginResponse.body as TokenResponseDto)
      .accessToken;

    // B의 본인 다이어리 작성
    const createResponse = await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({
        title: '다른 사용자의 다이어리',
        content: '비밀',
        diaryDate: '2026-11-02',
      })
      .expect(201);
    // B의 다이어리 id 값 받아두기
    const otherDiaryId = (createResponse.body as DiaryResponseDto).id;

    // B는 본인 다이어리 조회 가능
    await request(app.getHttpServer())
      .get(`/diaries/${otherDiaryId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(200);

    // B가 아닌 다른 사용자가 B의 다이어리 조회 -> 404
    await request(app.getHttpServer())
      .get(`/diaries/${otherDiaryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('다이어리 AI 분석을 요청하면 200, 임의로 만든 가짜 AI 결과가 저장된다.', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '분석 테스트',
        content: '오늘은 기분이 좋았다.',
        diaryDate: '2026-11-14',
      })
      .expect(201);
    const diaryId = (createResponse.body as DiaryResponseDto).id;

    // 분석 요청
    const analysisResponse = await request(app.getHttpServer())
      .post(`/diaries/${diaryId}/analysis`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 분석 저장 확인
    const saveAnalysisResponse = await request(app.getHttpServer())
      .get(`/diaries/${diaryId}/analysis`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 가짜 AI 결과가 나왔는지 확인
    expect(
      (analysisResponse.body as DiaryAnalysisResponseDto).primaryEmotion,
    ).toBe('기쁨');
    expect((analysisResponse.body as DiaryAnalysisResponseDto).reply).toBe(
      expectedReply,
    );
    expect((saveAnalysisResponse.body as DiaryAnalysisResponseDto).reply).toBe(
      expectedReply,
    );
  });
});
