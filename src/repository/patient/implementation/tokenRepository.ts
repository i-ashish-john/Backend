// src/repository/patient/implementation/tokenRepository.ts
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
  
  // NEW METHODS FOR PASSWORD RESET
  
  async storeResetToken(
    userId: string,
    resetToken: string,
    expiryInSeconds: number = 3600 // 1 hour default
  ): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      console.log('Storing password reset token for user:', userId);
      
      await redisClient.set(`reset_token:${userId}`, resetToken, {
        EX: expiryInSeconds
      });
    } catch (error: any) {
      console.error('Error storing reset token:', error.message);
      throw error;
    }
  }

  async getResetToken(userId: string): Promise<string | null> {
    try {
      return await redisClient.get(`reset_token:${userId}`);
    } catch (error: any) {
      console.error('Error retrieving reset token:', error.message);
      throw error;
    }
  }

  async deleteResetToken(userId: string): Promise<void> {
    try {
      await redisClient.del(`reset_token:${userId}`);
    } catch (error: any) {
      console.error('Error deleting reset token:', error.message);
      throw error;
    }
  }
}
