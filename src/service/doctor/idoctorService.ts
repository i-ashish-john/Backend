import { IDoctor } from '../../model/doctorModel';

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string; 
}


export interface OtpResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface IDoctorService {
  registerDoctor(doctorData: SignupData): Promise<AuthResponse>;
  loginDoctor(email: string, password: string): Promise<AuthResponse>;
  logoutDoctor(userId: string): Promise<void>;
  getCurrentDoctor(userId: string): Promise<IDoctor>;

  sendSignupOTP(email: string, formData: SignupData): Promise<OtpResponse>;
  resendSignupOTP(email: string): Promise<OtpResponse>;
  verifySignupOTP(email: string, otp: string): Promise<AuthResponse>;

  sendResetToken(email: string): Promise<void>;
  resetPassword(email: string, token: string, newPassword: string): Promise<void>;

}