import { describe, it, expect } from '@jest/globals';
import { UpdateDiaryDto } from './update-diary.dto';
import { validate } from 'class-validator';

describe('UpdateDiaryDto', () => {
    it('title만 전달시 검증 통과', async() => {
        const dto = new UpdateDiaryDto();
        dto.title = '수정된 제목';

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('content가 null이면 검증 실패', async() => {
        const dto = new UpdateDiaryDto();
        dto.content = null as any;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
    });
});