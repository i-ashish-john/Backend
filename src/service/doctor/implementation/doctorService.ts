import { IDoctorService } from '../idoctorService';
import { IDoctorRepository } from '../../../repository/doctor/idoctorRepository';
import { ITokenRepository } from '../../../repository/doctor/itokenRepository';
import { SignupData, AuthResponse, OtpResponse } from '../../../service/doctor/idoctorService';
import { IDoctor } from '../../../model/doctorModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../../config/redisConfig';
import { sendEmail } from '../../../utils/emailService'; 
import crypto from 'crypto';

export class DoctorService implements IDoctorService {
  private doctorRepository: IDoctorRepository;
  private tokenRepository: ITokenRepository;

  constructor(doctorRepository: IDoctorRepository, tokenRepository: ITokenRepository) {
    this.doctorRepository = doctorRepository;
    this.tokenRepository = tokenRepository;
  }

  private generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  async sendSignupOTP(email: string, formData: SignupData): Promise<OtpResponse> {
    try {
      const existingDoctor = await this.doctorRepository.findByEmail(email);
      if (existingDoctor) {
        throw new Error('Email already registered');
      }

      const otp = this.generateOTP();
      console.log(`Generated OTP for ${email}:`, otp);

      await this.tokenRepository.storeSignupOtp(email, otp, 60); // 1 minute TTL
      await this.tokenRepository.storeSignupData(email, formData); // 7 minute TTL

      const emailSubject = 'Your Doctor Registration OTP';
      const emailBody = `
        <h1>Doctor Registration OTP</h1>
        <p>Your OTP for doctor registration is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 1 minute only.</p>
      `;
      await sendEmail(email, emailSubject, emailBody);

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        email,
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  async resendSignupOTP(email: string): Promise<OtpResponse> {
    try {
      const signupData = await this.tokenRepository.getSignupData(email);
      if (!signupData) {
        throw new Error('No pending signup found for this email');
      }

      const otp = this.generateOTP();
      console.log(`Regenerated OTP for ${email}:`, otp);

      await this.tokenRepository.storeSignupOtp(email, otp, 60); // 1 minute TTL

      const emailSubject = 'Your Doctor Registration OTP (Resent)';
      const emailBody = `
        <h1>Doctor Registration OTP</h1>
        <p>Your new OTP for doctor registration is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 1 minute only.</p>
      `;
      await sendEmail(email, emailSubject, emailBody);

      return {
        success: true,
        message: 'OTP resent successfully to your email',
        email,
      };
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      throw new Error(error.message || 'Failed to resend OTP');
    }
  }

  async verifySignupOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      const storedOTP = await this.tokenRepository.getSignupOtp(email);
      if (!storedOTP) {
        throw new Error('OTP expired or invalid');
      }

      if (storedOTP !== otp) {
        throw new Error('Invalid OTP');
      }

      const signupData = await this.tokenRepository.getSignupData(email);
      if (!signupData) {
        throw new Error('Signup data not found or expired');
      }

      await this.tokenRepository.deleteSignupOtp(email);
      const result = await this.registerDoctor(signupData);
      await this.tokenRepository.deleteSignupData(email);

      return result;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.message || 'OTP verification failed');
    }
  }
  async registerDoctor(doctorData: SignupData): Promise<AuthResponse> {
    const { name, email, password } = doctorData;

    const existingDoctor = await this.doctorRepository.findByEmail(email);
    if (existingDoctor) throw new Error('Email already registered');

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const doctor: Partial<IDoctor> = {
      name,        
      email,
      password: hashedPassword,
    };
    console.log('details----->>',doctor)
    const newDoctor = await this.doctorRepository.create(doctor);

    const accessToken = jwt.sign({ id: newDoctor._id }, process.env.JWT_SECRET!, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ id: newDoctor._id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
      
    return {
      success: true,
      message: 'Doctor registered successfully',
      data: { id: newDoctor._id, email: newDoctor.email },
      accessToken,
      refreshToken,
    };
  }

  async loginDoctor(email: string, password: string): Promise<AuthResponse> {
    console.log('Reached in login ---->');
    
    const doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) throw new Error('Doctor not found');

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) throw new Error('Invalid password');

    const accessToken = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET!, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ id: doctor._id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    return {
      success: true,
      message: 'Login successful',
      data: { id: doctor._id, email: doctor.email },
      accessToken,
      refreshToken,
    };
  }

  async logoutDoctor(userId: string): Promise<void> {
    await redisClient.del(`refreshToken:${userId}`);
  }

  async getCurrentDoctor(userId: string): Promise<IDoctor> {
    const doctor = await this.doctorRepository.findById(userId);
    if (!doctor) throw new Error('Doctor not found');
    return doctor;
  }

  async sendResetToken(email: string): Promise<void> {
    const doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) throw new Error('Doctor not found');
    
    const token = crypto.randomBytes(20).toString('hex');
    // store in Redis for 5 minutes
    await this.tokenRepository.storeResetToken(doctor._id.toString(), token, 5 * 60);
    
    const resetUrl = `${process.env.FRONTEND_URL}/doctor/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = 'HealSync Password Reset';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HealSync Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #7c3aed; /* purple-600 */
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 20px;
          }
          .logo {
            color: white;
            font-size: 22px;
            font-weight: bold;
          }
          .content {
            padding: 0 20px 20px;
          }
          h1 {
            color: #4c1d95; /* purple-900 */
            margin-top: 0;
          }
          p {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #8b5cf6; /* purple-500 */
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #7c3aed; /* purple-600 */
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
          }
          .expiry {
            color: #ef4444; /* red-500 */
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">HealSync</div>
          </div>
          <div class="content">
            <h1>Hello, Dr. ${doctor.name}</h1>
            <p>We received a request to reset your password for your HealSync account. Please click the button below to reset your password.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This password reset link will expire in <span class="expiry">5 minutes</span>.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HealSync. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(email, subject, html);
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) throw new Error('Doctor not found');
    const stored = await this.tokenRepository.getResetToken(doctor._id.toString());
    if (stored !== token) throw new Error('Invalid or expired token');
    // hash + update
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.doctorRepository.updatePassword(doctor._id.toString(), hashed);
    await this.tokenRepository.deleteResetToken(doctor._id.toString());
  }


}