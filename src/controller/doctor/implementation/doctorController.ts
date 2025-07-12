import { NextFunction, Request, Response } from 'express';
import { IDoctorController } from '../../../controller/doctor/idoctorController';

import { DoctorService } from '../../../service/doctor/implementation/doctorService'; 

import { DoctorRepository } from '../../../repository/doctor/implementation/doctorRepository';
import { IDoctorRepository } from '../../../repository/doctor/idoctorRepository';

import { TokenRepository } from '../../../repository/doctor/implementation/tokenRepository';
import { ITokenRepository } from '../../../repository/doctor/itokenRepository';

import { doctorSignupSchema } from '../../../lib/validations/doctorValidation'; 
import {redisClient} from '../../../config/redisConfig'; 
import { HttpStatusCode } from '../../../config/HttpStatusCode.enum';

export class DoctorController implements IDoctorController {
  private doctorService: DoctorService;

  constructor(doctorService: DoctorService) {
    const doctorRepository: IDoctorRepository = new DoctorRepository();
    const tokenRepository: ITokenRepository = new TokenRepository();
    this.doctorService = new DoctorService(doctorRepository, tokenRepository);
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      console.log('Request body:', req.body);
      const validatedData = doctorSignupSchema.parse(req.body);
      const result = await this.doctorService.registerDoctor(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async sendSignupOTP(req: Request, res: Response): Promise<void> {
    try { 
      const { email, name, password, licenseNumber, specialization } = req.body;
      console.log('HHHHHHH', req.body);
      if (!email || !name || !password || !licenseNumber || !specialization) {
        res.status(400).json({ success: false, message: 'Email, name, password, license number, and specialization are required' });
        return;
      }
      const formData = { name, email, password, licenseNumber, specialization };
      
      const result = await this.doctorService.sendSignupOTP(email, formData);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async resendSignupOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Email is required' });
        return;
      }
      const result = await this.doctorService.resendSignupOTP(email);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async verifySignupOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Email and OTP are required' });
        return;
      }
      const result = await this.doctorService.verifySignupOTP(email, otp);
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'OTP verified and registration successful',
        user: result.data,
      });
    } catch (error: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  // async login(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { email, password } = req.body;
  //     console.log('first')
  //     const result = await this.doctorService.loginDoctor(email, password);

  //     res.cookie('accessToken', result.accessToken, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       maxAge: 5 * 60 * 1000,
  //     });

  //     await redisClient.setEx(`refreshToken:${result.data.id}`, 7 * 24 * 60 * 60, result.refreshToken);

  //     res.status(200).json({ user: result.data, message: 'Login successful' });
  //   } catch (error: any) {
  //     res.status(401).json({ message: error.message });
  //   }
  // }
  
 async login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await this.doctorService.loginDoctor(email, password);
    // Remove cookie setting
    await redisClient.setEx(`refreshToken:${result.data.id}`, 7 * 24 * 60 * 60, result.refreshToken);
    res.status(HttpStatusCode.OK).json({ success: true, message: 'Login successful', data: result.data, accessToken: result.accessToken });
  } catch (error: any) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: error.message });
  }
}
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assumed from auth middleware
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }
      await this.doctorService.logoutDoctor(userId);
      res.clearCookie('accessToken');
      res.status(HttpStatusCode.OK).json({ message: 'Logout successful' });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('getMe: User from middleware', req.user); 
    if (!req.user || !req.user.id) {
      throw new Error('User not found in request');
    }
    const doctor = await this.doctorService.getCurrentDoctor(req.user.id);
    console.log('getMe: Doctor data to return', doctor); // Debug log
  
    res.status(200).json({
      success: true,
      message: 'Doctor fetched successfully',
      data: doctor,
    });
  } catch (error: any) {
    next(error);
  }
}

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Email is required' });
        return;
      }
      await this.doctorService.sendResetToken(email);
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Password reset link sent' });
    } catch (err: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Extract data from the request body
      const { email, token, newPassword } = req.body;

      // Validate input
      if (!email || !token || !newPassword) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Email, token, and new password are required',
        });
        return;
      }

      // Call the service to reset the password
      await this.doctorService.resetPassword(email, token, newPassword);

      // Send success response
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      // Handle errors from the service
      let statusCode = HttpStatusCode.BAD_REQUEST;
      let message = error.message || 'An error occurred';

      if (error.message === 'Doctor not found') {
        statusCode = HttpStatusCode.NOT_FOUND;
        message = 'Doctor not found';
      } else if (error.message === 'Token has expired') {
        statusCode = HttpStatusCode.GONE; // 410 for expired tokens
        message = 'The reset token has expired';
      } else if (error.message === 'Invalid token') {
        statusCode = HttpStatusCode.BAD_REQUEST;
        message = 'The reset token is invalid';
      }

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

async updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { name, specialization } = req.body;
    if (!name || !specialization) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Name and specialization are required' });
      return;
    }
    const updatedDoctor = await this.doctorService.updateDoctorProfile(userId, { name, specialization });
    res.status(HttpStatusCode.OK).json({ success: true, data: updatedDoctor, message: 'Profile updated successfully' });
  } catch (error: any) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}

}