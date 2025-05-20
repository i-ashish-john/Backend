import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpStatusCode } from '../../config/ HttpStatusCode.enum';

export interface AuthenticatedRequest {
  user?: { id: string; role: string };
}

export const authenticate: RequestHandler = (req, res, next) => {
  const token =
    req.cookies?.adminAccessToken ||
    req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .json({ success: false, message: 'Access token required' });
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: 'JWT secret not configured' });
  }

  try {
    const payload = jwt.verify(token, secret) as { id: string; role: string };
    (req as AuthenticatedRequest).user = {
      id: payload.id,
      role: payload.role,
    };
    next();
  } catch {
    return res
      .status(HttpStatusCode.UNAUTHORIZED)
      .json({ success: false, message: 'Invalid or expired token' });
  }
};