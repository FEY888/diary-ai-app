import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DiaryAnalysisResult } from './types/diary-analysis-result.type';

const PRIMARY_EMOTION_MAX_LENGTH = 50;
const AI_MODEL = 'gpt-5.6-luna';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
      timeout: 60_000,
      maxRetries: 0,
    });
  }

  async analyzeDiary(content: string): Promise<DiaryAnalysisResult> {
    const startTime = Date.now();

    try {
      const response = await this.openai.responses.create({
        model: AI_MODEL,

        instructions: `
너는 사용자의 개인 다이어리를 분석하는 AI다.

다이어리의 내용만 근거로 분석하라.
과도하게 추측하지 마라.

각 필드는 다음 기준으로 작성한다.

- summary:
  다이어리 내용을 자연스럽게 1~2문장으로 요약한다.

- reply:
  사용자가 적은 본문 내용을 보고 답장은 한국어로 2~4문장 작성한다. summary 요약에 있는 내용과 반복되는 문장은 금지한다.
  본문을 단순히 다시 요약하지 말고, 구체적인 내용에 반응한다. 예를들어 친한 친구처럼 공감해주는 말이나 위로해주는 말이나 
  대화하듯이 친근한 말투로 이러이러한 일이 있었구나라며 너의 생각을 얘기해준다.
  

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
  행동 추천은 하되 해결책을 작성하지 않는다.

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

                reply: { type: 'string' },

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
                'reply',
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

      const durationMs = Date.now() - startTime;
      const usage = response.usage;
      this.logger.log(
        `AI 분석 완료 model=${AI_MODEL} inputTokens=${usage?.input_tokens} outputTokens=${usage?.output_tokens} totalTokens=${usage?.total_tokens} ${durationMs}ms`,
      );

      const result: DiaryAnalysisResult = JSON.parse(response.output_text);

      if (result.primaryEmotion.length > PRIMARY_EMOTION_MAX_LENGTH) {
        throw new Error('AI의 primaryEmotion 응답이 너무 깁니다.');
      }

      return result;
    } catch (error) {
      this.logger.error(
        `OpenAI API 호출 실패 (${Date.now() - startTime}ms)`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'AI 분석 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }
}
