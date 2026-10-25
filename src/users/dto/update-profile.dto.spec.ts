import { describe, it, expect } from '@jest/globals';
import { UpdateProfileDto } from "./update-profile.dto";
import { validate } from "class-validator";

describe('UpdateProfileDto', () => {

    it('nickname을 생략하면 검증 통과', async() => {
        const dto = new UpdateProfileDto();

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('nickname이 null이면 검증 실패', async() => {
        const dto = new UpdateProfileDto();
        dto.nickname = null as any;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
    });
});