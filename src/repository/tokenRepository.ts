import { redisClient } from '../config/redisConfig';

export const storeRefreshToken = async (//userId as refference
  userId: string, 
  refreshToken: string,
  expiryInSeconds: number = 7 * 24 * 60 * 60 //(7days)
): Promise<void> => {

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect(); //for connectionsecurity
    }
    console.log('Storing refresh token:', refreshToken);

    await redisClient.set(`refresh_token:${userId}`, refreshToken, {
      EX: expiryInSeconds
    })
  } catch (error: any) {
    console.error('Error storing refresh token:', error.message);
    throw error;
  }
};

export const getRefreshToken = async (userId: string): Promise<string | null> => {//taking by user's id
  try {
    return await redisClient.get(`refresh_token:${userId}`);
  } catch (error: any) {
    console.error('Error retrieving refresh token:', error.message);
    throw error;
  }
};

export const deleteRefreshToken = async (userId: string): Promise<void> => {
  try {// Delete  token when user logs out
    await redisClient.del(`refresh_token:${userId}`);
  } catch (error: any) {
    console.error('Error deleting refresh token:', error.message);
    throw error;
  }
};

// // Delete all refresh tokens (useful for testing or system reset)
// export const deleteAllRefreshTokens = async (): Promise<void> => {
//   try {
//     const keys = await redisClient.keys('refresh_token:*');
//     if (keys.length > 0) {
//       await redisClient.del(keys);
//     }
//   } catch (error: any) {
//     console.error('Error deleting all refresh tokens:', error.message);
//     throw error;
//   }
// };