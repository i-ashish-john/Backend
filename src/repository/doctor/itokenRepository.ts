export interface ITokenRepository {
    storeRefreshToken(userId: string, refreshToken: string, expiryInSeconds?: number): Promise<void>;
    getRefreshToken(userId: string): Promise<string | null>;
    deleteRefreshToken(userId: string): Promise<void>;
    
    storeSignupOtp(email: string, otp: string, ttl?: number): Promise<void>;
    getSignupOtp(email: string): Promise<string | null>;
    deleteSignupOtp(email: string): Promise<void>;
    
    storeSignupData(email: string, data: any): Promise<void>;
    getSignupData(email: string): Promise<any | null>;
    deleteSignupData(email: string): Promise<void>;
  }