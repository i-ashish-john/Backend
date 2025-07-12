import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HttpStatusCode } from '../../config/HttpStatusCode.enum';
import { AuthenticatedRequest } from './DrAuthMiddleware';

export const verifyRole = (allowedRoles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as AuthenticatedRequest).user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        success: false,
        message: 'Access denied: insufficient permissions',
      });
    }

    next();
  };
};
