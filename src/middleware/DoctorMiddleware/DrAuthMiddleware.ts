import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { HttpStatusCode } from '../../config/ HttpStatusCode.enum';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest {
  user?: { id: string; role: string };
}

// Authentication middleware as a standard RequestHandler
export const authenticate: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || (req as any).cookies?.accessToken;
    if (!token) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Access token required' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' });
  }
};