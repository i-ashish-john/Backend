import { ITokenRepository } from "../itokenRepository";
import { redisClient } from '../../../config/redisConfig';

export class TokenRepository implements ITokenRepository {
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiryInSeconds: number = 7 * 24 * 60 * 60 // 7 days
  ): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect(); // for connection security
      }
      console.log('Storing refresh token:', refreshToken);
      
      await redisClient.set(`refresh_token:${userId}`, refreshToken, {
        EX: expiryInSeconds
      });
    } catch (error: any) {
      console.error('Error storing refresh token:', error.message);
      throw error;
    }
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      return await redisClient.get(`refresh_token:${userId}`);
    } catch (error: any) {
      console.error('Error retrieving refresh token:', error.message);
      throw error;
    }
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    try {
      await redisClient.del(`refresh_token:${userId}`);
    } catch (error: any) {
      console.error('Error deleting refresh token:', error.message);
      throw error;
    }
  }
}