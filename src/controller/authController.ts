import { Request, Response, NextFunction } from "express";
import { registerUser, loginUserService, generateTokens, verifyRefreshToken } from "../service/authService";
import { createRefreshToken, deleteRefreshToken } from "../repository/tokenRepository";
import mongoose from "mongoose";
import { Iuser } from "../model/user";


export const signup = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }

    const newUser = await registerUser({ username, email, password });
    
    const { accessToken, refreshToken } = await generateTokens(newUser);
    
    // Store refresh token in database
    await createRefreshToken({ userId: newUser._id as string | mongoose.Types.ObjectId, token: refreshToken });
    
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    })

    } catch (error: any) {
    console.error('Signup controller error:', error.message);

      return res.status(400).json({ 
         success: false, 
        message: error.message || 'Registration failed' 
      })

  }

};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
const { user, isPasswordValid }: { user: { _id: string | mongoose.Types.ObjectId; username: string; email: string; role: string } | null, isPasswordValid: boolean } = await loginUserService(email, password) as { user: { _id: string | mongoose.Types.ObjectId; username: string; email: string; role: string } | null, isPasswordValid: boolean };    
    if (!user || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    
    const { accessToken, refreshToken } = await generateTokens(user as Iuser);
    
    // Store refresh token in database
    await createRefreshToken({ userId: user._id, token: refreshToken });
    
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    const userData = await verifyRefreshToken(refreshToken) as Iuser;
    
    if (!userData) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    if (!userData) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
   
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(userData as Iuser);
    
    await deleteRefreshToken(refreshToken);
    await createRefreshToken({ userId: userData._id as string | mongoose.Types.ObjectId, token: newRefreshToken });
    

    res.cookie('refreshToken', newRefreshToken, { //http only cookie storing
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error: any) {
    console.error('Refresh token error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      
      await deleteRefreshToken(refreshToken);
    }
    
    
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Get current user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};