import { Request, Response } from 'express';
import { IDoctorController } from '../../../controller/doctor/idoctorController';
import { DoctorService } from '../../../service/doctor/implementation/doctorService'; // Adjusted service path
import { doctorSignupSchema } from '../../../lib/validations/doctorValidation'; // Corrected path
import {redisClient} from '../../../config/redisConfig'; // Assumed Redis setup

export class DoctorController implements IDoctorController {
  private doctorService: DoctorService;

  constructor(doctorService: DoctorService) {
    this.doctorService = doctorService;
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
      const { email, name, password } = req.body;
      console.log('HHHHHHH',req.body)
      if (!email || !name || !password) {
        res.status(400).json({ success: false, message: 'Email, name, and password are required' });
        return;
      }
      const formData = { name, email, password };
      const result = await this.doctorService.sendSignupOTP(email, formData);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resendSignupOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      const result = await this.doctorService.resendSignupOTP(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifySignupOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email and OTP are required' });
        return;
      }
      const result = await this.doctorService.verifySignupOTP(email, otp);
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      res.status(200).json({
        success: true,
        message: 'OTP verified and registration successful',
        user: result.data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.doctorService.loginDoctor(email, password);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000,
      });

      await redisClient.setEx(`refreshToken:${result.data.id}`, 7 * 24 * 60 * 60, result.refreshToken);

      res.status(200).json({ user: result.data, message: 'Login successful' });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }
  
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assumed from auth middleware
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      await this.doctorService.logoutDoctor(userId);
      res.clearCookie('accessToken');
      res.status(200).json({ message: 'Logout successful' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const user = await this.doctorService.getCurrentDoctor(userId);
      res.status(200).json({ user, message: 'User details retrieved' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}