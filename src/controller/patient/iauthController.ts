import { Request, Response, NextFunction } from "express";

export interface IAuthController {
  signup(req: Request, res: Response, next: NextFunction): Promise<Response>;
  login(req: Request, res: Response, next: NextFunction): Promise<Response>;
  logout(req: Request, res: Response, next: NextFunction): Promise<Response>;
  refresh(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getMe(req: Request, res: Response, next: NextFunction): Promise<Response>;

  // Add these methods for password reset
  forgotPassword(req: Request, res: Response): Promise<Response>;
  verifyResetToken(req: Request, res: Response): Promise<Response>;
  resetPassword(req: Request, res: Response): Promise<Response>;
  
  getProfile(req: Request, res: Response, next: NextFunction): Promise<Response>;
}