import { IAuthRepository } from "../../../repository/patient/iauthRepository";
import { ITokenRepository } from "../../../repository/patient/itokenRepository";
import { HttpStatusCode } from "../../../config/ HttpStatusCode.enum";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export class PasswordResetService {
  private _authRepository: IAuthRepository;
  private _tokenRepository: ITokenRepository;
  
  constructor(authRepository: IAuthRepository, tokenRepository: ITokenRepository) {
    this._authRepository = authRepository;
    this._tokenRepository = tokenRepository;
  }

  // Generate a random reset token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async storeResetToken(userId: string, token: string): Promise<void> {
    await this._tokenRepository.storeResetToken(userId, token, 3600);//store for 1 hr
  }

  private generateOtp(): string {//otp after signup
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  // Request password reset
  async requestPasswordReset(email: string, frontendResetUrl: string): Promise<boolean> {
    try {
      const user = await this._authRepository.findUserByEmail(email);
      if (!user) {
        throw {
          message: 'No account found with that email',
          statusCode: HttpStatusCode.NOT_FOUND
        };
      }

      const userId = (user as { _id: { toString: () => string } })._id.toString();
      const resetToken = this.generateToken();//generating
      await this.storeResetToken(userId, resetToken);//storing
      
      // Create reset URL
      const resetUrl = `${frontendResetUrl}?token=${resetToken}&email=${encodeURIComponent(email)}`;
      await this.sendResetEmail(email, resetUrl);//send email
      
      return true;
    } catch (error: any) {
      console.error('Password reset request error:', error);
      throw {
        message: error.message || 'Failed to process password reset request',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  // Send password reset email
  private async sendResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      console.log('Sending password reset email to:', email);
      console.log('Reset URL:', resetUrl);
      console.log('SMTP Host:', process.env.SMTP_HOST);
      console.log('SMTP User:', process.env.SMTP_USER);
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,//process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
  
      // Verify connection configuration
      await transporter.verify();
      console.log('SMTP connection verified successfully');
  
      const mailOptions = {
        from: process.env.EMAIL_FROM ,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; border-radius: 4px; cursor: pointer; text-decoration: none;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `
      };
  
      console.log('Sending email with options:', mailOptions);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Email sending error:', error);
      throw {
        message: 'Failed to send password reset email',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  }
// for otp after signuup 
private async sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
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
    to,
    subject,
    html,
  });
}

  // Verify reset token
  async verifyResetToken(token: string, email: string): Promise<{valid: boolean, userId: string | null}> {
    try {
      const user = await this._authRepository.findUserByEmail(email);
      if (!user) {
        return { valid: false, userId: null };
      }

      const userId = (user as { _id: { toString: () => string } })._id.toString();
      console.log('userId:', userId);
      
      const storedToken = await this._tokenRepository.getResetToken(userId); // Get token from Redis
      
      if (!storedToken || storedToken !== token) {
        return { valid: false, userId: null };
      }
      
      return { valid: true, userId };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false, userId: null };
    }
  }

  // Reset password
  async resetPassword(token: string, email: string, newPassword: string): Promise<boolean> {
    try {
      // Verify token
      const { valid, userId } = await this.verifyResetToken(token, email);
      
      if (!valid || !userId) {
        throw {
          message: 'Invalid or expired reset token',
          statusCode: HttpStatusCode.BAD_REQUEST
        };
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update user password
      const user = await this._authRepository.updatePassword(userId, hashedPassword);
      if (!user) {
        throw {
          message: 'User not found',
          statusCode: HttpStatusCode.NOT_FOUND
        };
      }
      
      await this._tokenRepository.deleteResetToken(userId);//deleting the reset token//
      return true;

    } catch (error: any) {
      console.error('Password reset error:', error);
      throw {
        message: error.message || 'Failed to reset password',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  }
  
  // Generate OTP for signup
async sendSignupOtp(email: string): Promise<void> {
  const user = await this._authRepository.findUserByEmail(email);
  if (!user) throw { message: "No such user", statusCode: 404 };

  const userId = (user._id as any).toString();
  const otp = this.generateOtp();
  
  await this._tokenRepository.storeResetToken(`signup_otp:${userId}`, otp, 120);

  // send via email
  const html = `
    <h1>Your HealSync signup code</h1>
    <p>Enter this code on the website to finish signing up:</p>
    <div style="font-size:2rem; font-weight:bold; color:#9333EA;">${otp}</div>
    <p>It expires in 2 minutes.</p>`;
  await this.sendEmail(email, "Your signup code", html);
}
 

async verifySignupOtp(userId: string, code: string): Promise<boolean> {
  const stored = await this._tokenRepository.getResetToken(`signup_otp:${userId}`);
  if (stored === code) {
    await this._tokenRepository.deleteResetToken(`signup_otp:${userId}`);
    return true;
  }
  return false;
}
}
//otp after signup
