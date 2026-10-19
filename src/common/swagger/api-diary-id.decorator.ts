import { applyDecorators } from '@nestjs/common';
import {ApiBadRequestResponse, ApiNotFoundResponse, ApiParam,} from '@nestjs/swagger';

export function ApiDiaryId(
    badRequestDescription = '다이어리 ID 형식이 올바르지 않음',
) {
  return applyDecorators(
    ApiParam({
      name: 'id',
      description: '다이어리 ID',
      example: 4,
    }),
    ApiBadRequestResponse({
      description: badRequestDescription,
    }),
    ApiNotFoundResponse({
      description:
        '다이어리를 찾을 수 없거나 해당 사용자의 다이어리가 아님',
    }),
  );
}