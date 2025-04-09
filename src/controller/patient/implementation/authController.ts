import { Request, Response, NextFunction } from "express";
import { IAuthController } from "../iauthController";
import { IAuthService } from "../../../service/patient/iauthService";

export class AuthController implements IAuthController {
  private  _authService: IAuthService;

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
    
      return res.status(201).json({
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
  
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
  //  console.log('GOING TO RETRN LOGIN<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      return res.status(200).json({
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
      return res.status(400).json({ 
        success: false, 
        message: error.message || 'Login failed' 
      });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id; // Get user ID from authmiddleware from req.user
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      await this._authService.logoutUser(userId);
      // Clear cookies
      res.clearCookie('accessToken');
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
        const refreshToken = req.cookies.refreshToken  
      if (!refreshToken) {
        return res.status(401).json({ 
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
  // New method: Get current user details
  async getMe(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      // Option 1: If you simply want to return the user id from the token:
      return res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: {
          userId: userId
        }
      });

      // Option 2: If you want to fetch the full user details from the database,
      // you can call a method on AuthService (e.g., getUserById) if implemented.
      /*
      const user = await this._authService.getUserById(userId);
      return res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: user
      });
      */
    } catch (error: any) {
      console.error('Get current user error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user details'
      });
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
      // For now, returning sample dashboard data
      return res.status(200).json({
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
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve dashboard data'
      });
    }
  }
}