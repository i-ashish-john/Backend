import { RequestHandler } from 'express';
import { HttpStatusCode } from '../../config/ HttpStatusCode.enum';
import { AuthenticatedRequest } from './DrAuthMiddleware';

// Role verification as RequestHandler
export const verifyRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const role = (req as AuthenticatedRequest).user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(HttpStatusCode.FORBIDDEN).json({ success: false, message: 'Access denied: insufficient permissions' });
    }
    return next();
  };
};
