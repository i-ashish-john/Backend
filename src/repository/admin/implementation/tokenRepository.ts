import { redisClient } from '../../../config/redisConfig';

export class TokenRepository {
  // 7 days default
  async storeRefreshToken(userId: string, refreshToken: string, ttlSeconds = 7 * 24 * 60 * 60): Promise<void> {
    await redisClient.set(`admin_refresh_token:${userId}`, refreshToken, { EX: ttlSeconds });
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return await redisClient.get(`admin_refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await redisClient.del(`admin_refresh_token:${userId}`);
  }
}
