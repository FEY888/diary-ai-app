import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findById: jest.fn<() => Promise<unknown>>(),
    replaceRefreshToken: jest.fn<UsersService['replaceRefreshToken']>(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn<() => Promise<string>>(),
  };

  const configServiceMock = {
    getOrThrow: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    configServiceMock.getOrThrow.mockReturnValue('test-secret');

    service = new AuthService(
      usersServiceMock as unknown as UsersService,
      jwtServiceMock as unknown as JwtService,
      configServiceMock as unknown as ConfigService,
    );
  });

  it('기존 refresh token 검증 후 해시 교체에 실패하면 재발급을 거절한다.', async () => {
    const userId = 'user-1';
    const oldRefreshToken = 'old-refresh-token';
    const previousHash = await argon2.hash(oldRefreshToken);
    const newRefreshToken = 'new-refresh-token';

    usersServiceMock.findById.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      role: 'user',
      refreshTokenHash: previousHash,
    });

    jwtServiceMock.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce(newRefreshToken);

    usersServiceMock.replaceRefreshToken.mockResolvedValue(false);

    await expect(
      service.refreshTokens(userId, oldRefreshToken),
    ).rejects.toThrow(UnauthorizedException);

    expect(usersServiceMock.replaceRefreshToken).toHaveBeenCalledWith(
      userId,
      previousHash,
      expect.any(String),
    );

    const [, , newHash] = usersServiceMock.replaceRefreshToken.mock.calls[0];
    expect(await argon2.verify(newHash, newRefreshToken)).toBe(true);
  });
});
