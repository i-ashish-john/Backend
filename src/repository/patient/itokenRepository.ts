// src/repository/patient/itokenRepository.ts
export interface ITokenRepository {
  storeRefreshToken(userId: string, refreshToken: string, expiryInSeconds?: number): Promise<void>;
  getRefreshToken(userId: string): Promise<string | null>;
  deleteRefreshToken(userId: string): Promise<void>;
  
  // Add these new methods for password reset
  storeResetToken(userId: string, resetToken: string, expiryInSeconds?: number): Promise<void>;
  getResetToken(userId: string): Promise<string | null>;
  deleteResetToken(userId: string): Promise<void>;
  
}