import { applyDecorators } from '@nestjs/common';
import { ApiUnauthorizedResponse } from '@nestjs/swagger';

export function ApiAccessTokenResponse() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Access Token이 없거나 유효하지 않음',
    }),
  );
}