import { describe, it, expect } from '@jest/globals';
import { CreateDiaryDto } from './create-diary.dto';
import { validate } from 'class-validator';

describe('CreateDiaryDto', () => {
  it('달력에 없는 날짜(예)2월 30일)이면 diaryDate 검증 실패', async () => {
    const dto = new CreateDiaryDto();
    dto.title = '날짜 테스트';
    dto.content = '본문';
    dto.diaryDate = '2026-02-30';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('diaryDate');
  });
});
