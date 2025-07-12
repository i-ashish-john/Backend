import jwt from 'jsonwebtoken';
import { Request, RequestHandler } from 'express';
import { HttpStatusCode } from '../../config/HttpStatusCode.enum';


export interface AuthenticatedUser {
  id: string;
  role: string; 
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;  
}

export const authenticate: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || (req as any).cookies?.accessToken;
    if (!token) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Access token required' });
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');

    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    
    (req as AuthenticatedRequest).user = decoded;  // Adding decoded user to the request object

    next();
  } catch (error) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' });
  }
};
