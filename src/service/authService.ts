import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserByUsername, findUserById } from "../repository/authRepository";
import { IuserInput, Iuser } from "../model/userModel";
import { findRefreshTokenByToken } from "../repository/tokenRepository";

// JWT secrets should be in .env file
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export const registerUser = async (userData: IuserInput): Promise<Iuser> => {
  
  try {

    if (!userData.username || !userData.email || !userData.password) {
      throw new Error("Invalid user data provided");
    }

        const existingUserByEmail = await findUserByEmail(userData.email);
        if (existingUserByEmail) {
          throw new Error('Email already registered');
        }

    const existingUserByUsername = await findUserByUsername(userData.username);
    if (existingUserByUsername) {
        throw new Error('Username already taken');
    }

      const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = await createUser({
      ...userData,
      password: hashedPassword
    });

    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginUserService = async (email: string, password: string) => {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      return { user: null, isPasswordValid: false };
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    return { user, isPasswordValid };
  } catch (error: any) {
    throw new Error(error.message || 'Login service failed');
  }
};

export const generateTokens = async (user: Iuser) => {
  try {
    // Create payload for tokens
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role || 'patient'
    };
    
   
    const accessToken = jwt.sign(// creatign acess token
      payload, 
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    
   
    const refreshToken = jwt.sign( // refresh in 7 days
      payload,
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }

    } catch (error: any) {
        throw new Error(error.message || 'Token generation failed');
    }
};

export const verifyAccessToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string };
    const user = await findUserById(decoded.userId);
    return user;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (token: string) => {
  try {
    // First check if token exists in database
    const refreshTokenDoc = await findRefreshTokenByToken(token);
    
    if (!refreshTokenDoc) {
      return null;
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    const user = await findUserById(decoded.userId);
    
    return user;
  } catch (error) {
    return null;
  }
};