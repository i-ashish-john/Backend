export interface ITokenRepository {
    storeRefreshToken(userId: string, refreshToken: string, expiryInSeconds?: number): Promise<void>;
    getRefreshToken(userId: string): Promise<string | null>;
    deleteRefreshToken(userId: string): Promise<void>;
  }