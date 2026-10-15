import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DiaryAnalysisResult } from '../auth/types/diary_analysis_result.type';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly openai: OpenAI
    

    constructor(
        private readonly configService: ConfigService,
        
    ) {

        this.openai = new OpenAI({
            apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
        });
    }

   async analyzeDiary(content: string): Promise<DiaryAnalysisResult> {
    try{

  const response = await this.openai.responses.create({
    model: 'gpt-5.6-luna',

     instructions: `
너는 사용자의 개인 일기를 분석하는 AI다.

일기의 내용만 근거로 분석하라.
과도하게 추측하지 마라.

각 필드는 다음 기준으로 작성한다.

- summary:
  일기 내용을 자연스럽게 1~2문장으로 요약한다.

- primaryEmotion:
  가장 핵심적인 감정 하나만 작성한다.
  예: 기쁨, 만족, 불안, 슬픔, 분노, 평온, 피로

- keywords:
  일기의 핵심 주제나 사건을 나타내는 단어를 최대 5개 추출한다.

- concerns:
  사용자가 현재 걱정하거나 부담을 느끼는 요소를 추출한다.
  명확한 걱정이 없다면 빈 배열 []을 반환한다.

- needs:
  사용자의 말에서 드러나는 심리적 또는 현실적인 욕구를 추출한다.
  예: 휴식, 성취감, 안정감, 인정, 성장, 관계, 집중
  행동 추천이나 해결책을 작성하지 않는다.

반드시 일기 내용에서 근거를 찾을 수 있는 내용만 작성하라.
`,
    input: content,

    text: {
      format: {
        type: 'json_schema',
        name: 'diary_analysis',
        strict: true,

        schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            primaryEmotion: { type: 'string' },

            keywords: {
              type: 'array',
              items: { type: 'string' },
            },

            concerns: {
              type: 'array',
              items: { type: 'string' },
            },

            needs: {
              type: 'array',
              items: { type: 'string' },
            },
          },

          required: [
            'summary',
            'primaryEmotion',
            'keywords',
            'concerns',
            'needs',
          ],

          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
    }catch(error) {
       this.logger.error('OpenAi API 호출 실패', error instanceof Error ? error.stack : String(error));

        throw new ServiceUnavailableException('AI 분석 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  
}
       
    }

