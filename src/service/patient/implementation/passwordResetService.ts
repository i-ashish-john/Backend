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

  // Store reset token in Redis
  private async storeResetToken(userId: string, token: string): Promise<void> {
    // Store for 1 hour (3600 seconds)
    await this._tokenRepository.storeResetToken(userId, token, 3600);
  }

  // Request password reset
  async requestPasswordReset(email: string, frontendResetUrl: string): Promise<boolean> {
    try {
      const user = await this._authRepository.findUserByEmail(email);
      // console.log("user found ====",user)
      // console.log("email ====",email);
      if (!user) {
        // For security reasons, don't reveal if email exists or not
        return true;
      }
      const userId = (user as { _id: { toString: () => string } })._id.toString();
      
      // Generate and store reset token
      const resetToken = this.generateToken();
      await this.storeResetToken(userId, resetToken);
      
      // Create reset URL
      const resetUrl = `${frontendResetUrl}?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // Send email
      await this.sendResetEmail(email, resetUrl);
      
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

  // Verify reset token
  async verifyResetToken(token: string, email: string): Promise<{valid: boolean, userId: string | null}> {
    try {
      // Find user by email first
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
      
      // Delete the reset token
      await this._tokenRepository.deleteResetToken(userId);
      
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw {
        message: error.message || 'Failed to reset password',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  }
}
