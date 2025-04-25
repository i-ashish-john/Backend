import { Request, Response } from 'express';

export interface IDoctorController {
  signup(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  getMe(req: Request, res: Response): Promise<void>;

  sendSignupOTP(req: Request, res: Response): Promise<void>;
  resendSignupOTP(req: Request, res: Response): Promise<void>;
  verifySignupOTP(req: Request, res: Response): Promise<void>;

  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;

}