import { RequestHandler } from 'express';
import { HttpStatusCode } from '../../config/ HttpStatusCode.enum';
import { AuthenticatedRequest } from './authenticate';

export const verifyRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const role = (req as AuthenticatedRequest).user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json({ success: false, message: 'Access denied' });
    }
    next();
  };
};
