import { Request, Response, NextFunction } from "express";
import { IAuthController } from "../iauthController";
import { IAuthService } from "../../../service/patient/iauthService";

export class AuthController implements IAuthController {
  private readonly _authService: IAuthService;

  constructor(authService: IAuthService) {
    this._authService = authService;
  }

  async signup(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }

      const { user, accessToken, refreshToken } = await this._authService.registerUser({ username, email, password });
      
      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          accessToken
        }
      });
    } catch (error: any) {
      console.error('Signup controller error:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: error.message || 'Registration failed' 
      });
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      const { user, accessToken, refreshToken } = await this._authService.loginUser(email, password);
      
      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          accessToken
        }
      });
    } catch (error: any) {
      console.error('Login controller error:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: error.message || 'Login failed' 
      });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      // Get user ID from request (set by middleware)--> authMiddleware
      const userId = req.user?.id;   //from middleware
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      await this._authService.logoutUser(userId);
      
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      console.error('Logout controller error:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Logout failed' 
      });
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ 
          success: false, 
          message: 'Refresh token not found' 
        });
      }

      const newAccessToken = await this._authService.refreshAccessToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error: any) {
      console.error('Token refresh controller error:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: error.message || 'Token refresh failed' 
      });
    }
  }
}