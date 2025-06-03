import { Request, Response, NextFunction } from "express";
import { IAuthController } from "../iauthController";
import { IAuthService } from "../../../service/patient/iauthService";
import { HttpStatusCode } from "../../../config/ HttpStatusCode.enum";
import { PasswordResetService } from "../../../service/patient/implementation/passwordResetService";
import { AuthRepository } from "../../../repository/patient/implementation/authRepository";
import { TokenRepository } from "../../../repository/patient/implementation/tokenRepository";
import { redisClient } from "../../../config/redisConfig";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { IuserInput } from "../../../model/userModel";

export class AuthController implements IAuthController {
  private _authService: IAuthService;
  private _passwordResetService: PasswordResetService;
  private authRepository: AuthRepository; // Fix: Properly declare and initialize

  constructor(authService: IAuthService) {
    this._authService = authService;
    this.authRepository = new AuthRepository(); // Fix: Initialize here
    const tokenRepository = new TokenRepository();
    this._passwordResetService = new PasswordResetService(this.authRepository, tokenRepository);
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
      console.log('Login details:', { id: user._id, role: user.role });

      if (!user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      res.cookie('userId', user._id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'development',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          blocked: user.blocked,
          accessToken: accessToken
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
      console.log('reached IN THE LOGOUT ____');
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
      await this._authService.logoutUser(userId);
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

  async getMe(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      console.log("Reached /auth/me with user:", req.user);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized access" });
      }

      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({ success: false, message: "User not found" });
      }

      if (user.blocked) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are blocked by admin",
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "User details retrieved successfully",
        data: { userId, blocked: user.blocked },
      });
    } catch (error: any) {
      console.error("Get current user error:", error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || "Failed to retrieve user details" });
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

  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: 'Email is required' });
      }

      const frontendUrl = 'http://localhost:3000/patient/confirmpassword';
      await this._passwordResetService.requestPasswordReset(email, frontendUrl);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Reset link sent (if that email exists)',
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return res
        .status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }

  async verifyResetToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token, email } = req.query;
      console.log("verifying reset token---->", token, email);
      if (!token || !email) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Token and email are required'
        });
      }
      
      const { valid, userId } = await this._passwordResetService.verifyResetToken(
        token.toString(), 
        email.toString()
      );
      console.log('validity--->', valid, userId);
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

  async sendSignupOtp(req: Request, res: Response): Promise<Response> {
    const { username, email, password } = req.body;
    
    const authRepo = new AuthRepository();
    const tokenRepo = new TokenRepository();

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });
    if (await authRepo.findUserByEmail(email))
      return res.status(400).json({ success: false, message: "Email taken" });
    if (await authRepo.findUserByUsername(username))
      return res.status(400).json({ success: false, message: "Username taken" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await tokenRepo.storeSignupOtp(email, otp, 120);
    await redisClient.set(`signup_data:${email}`, JSON.stringify({ username, email, password }), { EX: 420 });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your HealSync signup code",
      html: `<div style="font-size:2rem;color:#9333EA">${otp}</div>
             <p>Expires in 2 minutes.</p>`
    });

    return res.json({ success: true, message: "OTP sent" });
  }

  async verifySignupOtp(req: Request, res: Response) {
    const { email, code } = req.body;

    const authRepo = new AuthRepository();
    const tokenRepo = new TokenRepository();

    if (!email || !code)
      return res.status(400).json({ success: false, message: "email+code required" });

    const stored = await tokenRepo.getSignupOtp(email);
    if (stored !== code)
      return res.status(400).json({ success: false, message: "Invalid or expired code" });

    const raw = await redisClient.get(`signup_data:${email}`);
    if (!raw)
      return res.status(400).json({ success: false, message: "Signup data expired" });

    const { username, password } = JSON.parse(raw);
    await authRepo.createUser({
      username,
      email,
      password: await bcrypt.hash(password, 10)
    });

    await tokenRepo.deleteSignupOtp(email);
    await redisClient.del(`signup_data:${email}`);

    res.json({ success: true, message: "Signup complete!" });
  }

  async resendSignupOtp(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Email is required" });
      }

      const authRepo = new AuthRepository();
      const tokenRepo = new TokenRepository();

      const existingUser = await authRepo.findUserByEmail(email);
      if (existingUser) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Email already registered, please log in" });
      }

      const signupData = await redisClient.get(`signup_data:${email}`);
      if (!signupData) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Signup session expired, please signup again" });
      }

      await tokenRepo.deleteSignupOtp(email);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const expirationTime = 120;
      
      await tokenRepo.storeSignupOtp(email, otp, expirationTime); 
      await redisClient.expire(`signup_data:${email}`, 420);

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.verify();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your HealSync signup code",
        html: `<div style="font-size:2rem;color:#9333EA">${otp}</div>
               <p>Expires in 5 minutes.</p>`
      });

      return res
        .status(HttpStatusCode.OK)
        .json({ success: true, message: "OTP resent successfully" });
    } catch (err: any) {
      console.error("Resend OTP error:", err.message || err);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Failed to resend OTP" });
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          profilePicture: user.profilePicture,
          totalAppointments: user.totalAppointments,
          joinedDate: user.createdAt,
          lastLogin: user.lastLogin,
          paymentDetails: user.paymentDetails || { method: "", cardLast4: "", billingAddress: "" },
        },
      });
    } catch (error: any) {
      console.error("Get profile error:", error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to retrieve profile",
      });
    }
  }

 async updateProfile(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      const { username, phoneNumber, dateOfBirth, address } = req.body; // Exclude email

      if (!username) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Username is required",
        });
      }

      const updateData: Partial<IuserInput> = {
        username,
        phoneNumber,
        dateOfBirth,
        address,
      };

      const updatedUser = await this.authRepository.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          dateOfBirth: updatedUser.dateOfBirth,
          address: updatedUser.address,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Update profile error:", error.message);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  }
}