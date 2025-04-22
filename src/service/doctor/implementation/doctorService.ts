import { IDoctorService } from '../idoctorService';
import { IDoctorRepository } from '../../../repository/doctor/idoctorRepository';
import { ITokenRepository } from '../../../repository/doctor/itokenRepository';
import { SignupData, AuthResponse, OtpResponse } from '../../../service/doctor/idoctorService';
import { IDoctor } from '../../../model/doctorModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redisClient } from '../../../config/redisConfig';
import { sendEmail } from '../../../utils/emailService'; 

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
}