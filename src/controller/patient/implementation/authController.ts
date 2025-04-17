import { Request, Response, NextFunction } from "express";
import { IAuthController } from "../iauthController";
import { IAuthService } from "../../../service/patient/iauthService";
import { HttpStatusCode } from "../../../config/ HttpStatusCode.enum";
import {PasswordResetService}  from "../../../service/patient/implementation/passwordResetService" // adjust the path as needed

import { AuthRepository } from "../../../repository/patient/implementation/authRepository";
import { TokenRepository } from "../../../repository/patient/implementation/tokenRepository";


export class AuthController implements IAuthController {
  private _authService: IAuthService;
  private _passwordResetService: PasswordResetService;

  constructor(authService: IAuthService) {
    this._authService = authService;
    // Initialize repositories for the password reset service
    const authRepository = new AuthRepository();
    const tokenRepository = new TokenRepository();
    this._passwordResetService = new PasswordResetService(authRepository, tokenRepository);
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }

      const { user, accessToken, refreshToken } = await this._authService.registerUser({ username, email, password });
    
      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
        }
      });
    } catch (error: any) {
      console.error('Signup controller error:', error.message);
      return res.status(HttpStatusCode.BAD_REQUEST).json({ 
        success: false, 
        message: error.message || 'Registration failed' 
      });
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      const { user, accessToken, refreshToken } = await this._authService.loginUser(email, password);
      console.log('THE DETAILS ------>>>>>>>>>>>>>>>>>>>>>>', user, accessToken, refreshToken);
      
      if (!user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      // Set cookies for access and refresh tokens
      res.cookie('userId', user._id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          accessToken: accessToken // Include token in response body as well
        }
      });
    } catch (error: any) {
      console.error('Login controller error:', error.message);
      return res.status(HttpStatusCode.BAD_REQUEST).json({ 
        success: false, 
        message: error.message || 'Login failed' 
      });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id; // Get user ID from auth middleware from req.user
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      await this._authService.logoutUser(userId);
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      console.error('Logout controller error:', error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: error.message || 'Logout failed' 
      });
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const refreshToken = req.cookies.refreshToken;  
      if (!refreshToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: 'Refresh token not found' 
        });
      }

      const newAccessToken = await this._authService.refreshAccessToken(refreshToken);

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
      });

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error: any) {
      console.error('Token refresh controller error:', error.message);
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: error.message || 'Token refresh failed' 
      });
    }
  }

  // New method: Get current user details
  async getMe(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      console.log("Reached /auth/me with user:", req.user);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized access",
        });
      }
  
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "User details retrieved successfully",
        data: { userId },
      });
    } catch (error: any) {
      console.error("Get current user error:", error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to retrieve user details",
      });
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
      // For now, returning sample dashboard data
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          userId: userId,
          dashboardItems: [
            { id: 1, title: 'Upcoming Appointments', count: 3 },
            { id: 2, title: 'Recent Prescriptions', count: 2 },
            { id: 3, title: 'Health Metrics', status: 'Good' }
          ],
          lastLogin: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Dashboard controller error:', error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to retrieve dashboard data'
      });
    }
  }

// // //

async forgotPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { email } = req.body;
    console.log("------->>")
    console.log("Reached-?");
    
    if (!email) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Email is required'
      });
    }


    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/patient/confirmpassword';
    console.log('Frontend URL:', frontendUrl);

    console.log(frontendUrl,'-<--')
    // Request password reset and send email
    await this._passwordResetService.requestPasswordReset(email, frontendUrl);
    
    // Always return success, even if email doesn't exist (security best practice)
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'If that email exists in our system, a password reset link has been sent'
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to process password reset request'
    });
  }
}

async verifyResetToken(req: Request, res: Response): Promise<Response> {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Token and email are required'
      });
    }
    
    const { valid,userId } = await this._passwordResetService.verifyResetToken(
      token.toString(), 
      email.toString()
    );
    console.log('validity--->',valid,userId)
    if (!valid || !userId) {
      throw {
        message: 'Invalid or expired reset token',
        statusCode: HttpStatusCode.BAD_REQUEST
      };
    }
    
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to verify reset token'
    });
  }
}

async resetPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { token, email, password, confirmPassword } = req.body;
    
    if (!token || !email || !password || !confirmPassword) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Token, email, password, and confirm password are required'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    if (password.length < 8) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const result = await this._passwordResetService.resetPassword(token, email, password);
    
    if (result) {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } else {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
}



}
