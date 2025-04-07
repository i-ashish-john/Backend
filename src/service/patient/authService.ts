import { createUser, findUserByEmail, findUserByUsername } from "../../repository/authRepository";
import { storeRefreshToken, deleteRefreshToken } from "../../repository/tokenRepository";
import { IuserInput, Iuser } from "../../model/userModel";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getRefreshToken } from "../../repository/tokenRepository";


const generateAccessToken = (userId: string): string => {
  console.log('Generating access token for userId:', userId);
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: '15m' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  console.log('Generating refresh token for userId:', userId);
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' } // Longer-lived token
  );
};

export const registerUser = async (userData: IuserInput): Promise<{ user: Iuser, accessToken: string, refreshToken: string }> => {
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

    const salt = await bcrypt.genSalt(10);//hash before storing
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create new user with hashed password
    const newUser = await createUser({
      ...userData,
      password: hashedPassword
    });

    // Generate tokens
    const accessToken = generateAccessToken((newUser._id as string).toString());
    const refreshToken = generateRefreshToken((newUser._id as string).toString());

    await storeRefreshToken((newUser._id as string).toString(), refreshToken);

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginUser = async (email: string, password: string): Promise<{ user: Iuser, accessToken: string, refreshToken: string }> => {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = generateAccessToken((user._id as string).toString());
    const refreshToken = generateRefreshToken((user._id as string).toString());
    // const refreshToken = generateRefreshToken((newUser._id as string).toString());

    // Store refresh token in Redis
    await storeRefreshToken((user._id as string).toString(), refreshToken);

    return {
      user,
      accessToken,
      refreshToken
    };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const logoutUser = async (userId: string): Promise<void> => {
  try {
    // Delete refresh token from Redis
    await deleteRefreshToken(userId);
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
    
    // Get stored refresh token from Redis
    const storedToken = await getRefreshToken(decoded.userId);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    return generateAccessToken(decoded.userId);
  } catch (error: any) {
    throw new Error(error.message || 'Token refresh failed');
  }
};