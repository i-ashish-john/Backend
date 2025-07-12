export interface ITokenRepository {
  storeResetToken(userId: string, resetToken: string, expiryInSeconds?: number): Promise<void>;
  getResetToken(userId: string): Promise<string | null>;
  deleteResetToken(userId: string): Promise<void>;

    storeRefreshToken(userId: string, refreshToken: string, expiryInSeconds?: number): Promise<void>;
    getRefreshToken(userId: string): Promise<string | null>;
    deleteRefreshToken(userId: string): Promise<void>;
    //storing otp
    storeSignupOtp(email: string, otp: string, ttl?: number): Promise<void>;
    getSignupOtp(email: string): Promise<string | null>;
    deleteSignupOtp(email: string): Promise<void>;
    //storing data
    storeSignupData(email: string, data: any): Promise<void>;
    getSignupData(email: string): Promise<any | null>;
    deleteSignupData(email: string): Promise<void>;
  }