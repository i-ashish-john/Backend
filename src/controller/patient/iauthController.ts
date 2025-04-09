import { Request, Response, NextFunction } from "express";

export interface IAuthController {
  signup(req: Request, res: Response, next: NextFunction): Promise<Response>;
  login(req: Request, res: Response, next: NextFunction): Promise<Response>;
  logout(req: Request, res: Response, next: NextFunction): Promise<Response>;
  refresh(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response>;

}