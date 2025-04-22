import { ITokenRepository } from "../itokenRepository";
import { redisClient } from '../../../config/redisConfig';

export class TokenRepository implements ITokenRepository {
  async storeRefreshToken(userId: string, refreshToken: string, expiryInSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
    try {
      await redisClient.set(`doctor_refresh_token:${userId}`, refreshToken, { EX: expiryInSeconds });
    } catch (error: any) {
      console.error('Error storing doctor refresh token:', error.message);
      throw error;
    }
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      return await redisClient.get(`doctor_refresh_token:${userId}`);
    } catch (error: any) {
      console.error('Error retrieving doctor refresh token:', error.message);
      throw error;
    }
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    try {
      await redisClient.del(`doctor_refresh_token:${userId}`);
    } catch (error: any) {
      console.error('Error deleting doctor refresh token:', error.message);
      throw error;
    }
  }

  async storeSignupOtp(email: string, otp: string, ttl: number = 60): Promise<void> {
    try {
      console.log(`Storing OTP for doctor ${email}:`, otp);
      await redisClient.set(`doctor_signup_otp:${email}`, otp, { EX: ttl });
    } catch (error: any) {
      console.error('Error storing doctor signup OTP:', error.message);
      throw error;
    }
  }

  async getSignupOtp(email: string): Promise<string | null> {
    try {
      return await redisClient.get(`doctor_signup_otp:${email}`);
    } catch (error: any) {
      console.error('Error retrieving doctor signup OTP:', error.message);
      throw error;
    }
  }

  async deleteSignupOtp(email: string): Promise<void> {
    try {
      await redisClient.del(`doctor_signup_otp:${email}`);
    } catch (error: any) {
      console.error('Error deleting doctor signup OTP:', error.message);
      throw error;
    }
  }

  async storeSignupData(email: string, data: any): Promise<void> {
    try {
      console.log('Storing doctor signup data for:', email);
      await redisClient.set(`doctor_signup_data:${email}`, JSON.stringify(data), { EX: 7 * 60 });
    } catch (error: any) {
      console.error('Error storing doctor signup data:', error.message);
      throw error;
    }
  }

  async getSignupData(email: string): Promise<any | null> {
    try {
      const data = await redisClient.get(`doctor_signup_data:${email}`);
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      console.error('Error retrieving doctor signup data:', error.message);
      throw error;
    }
  }

  async deleteSignupData(email: string): Promise<void> {
    try {
      await redisClient.del(`doctor_signup_data:${email}`);
    } catch (error: any) {
      console.error('Error deleting doctor signup data:', error.message);
      throw error;
    }
  }
}