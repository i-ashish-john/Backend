import RefreshToken, { IRefreshTokenInput, IRefreshToken } from "../model/redis/token";

export const createRefreshToken = async (tokenData: IRefreshTokenInput): Promise<IRefreshToken> => {
  try {
      const result = await RefreshToken.create(tokenData);
          return result

  } catch (error: any) {
      console.error('Error creating refresh token:', error.message);
          throw error

  }
};

export const findRefreshTokenByToken = async (token: string): Promise<IRefreshToken | null> => {
  try {
    return await RefreshToken.findOne({ token });
  } catch (error: any) {
    console.error('Error finding refresh token:', error.message);
    throw error;
  }
};

export const findRefreshTokensByUserId = async (userId: string): Promise<IRefreshToken[]> => {
  try {
    return await RefreshToken.find({ userId });
  } catch (error: any) {
    console.error('Error finding refresh tokens by user ID:', error.message);
    throw error;
  }
};

export const deleteRefreshToken = async (token: string): Promise<boolean> => {
  try {
    const result = await RefreshToken.deleteOne({ token });
    return result.deletedCount > 0;
  } catch (error: any) {
    console.error('Error deleting refresh token:', error.message);
    throw error;
  }
};

export const deleteAllUserRefreshTokens = async (userId: string): Promise<boolean> => {
  try {
    const result = await RefreshToken.deleteMany({ userId });
    return result.deletedCount > 0;
  } catch (error: any) {
    console.error('Error deleting all refresh tokens for user:', error.message);
    throw error;
  }
};