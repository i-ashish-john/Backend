import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the decoded token interface
interface DecodedToken {
  id?: string;
  userId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      console.log(true)
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as DecodedToken;

    console.log('Decoded token:', decoded);

    // Extract user ID (either id or userId)
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Token missing user ID' });
    }

    // Assign user info to req.user
    req.user = { id: userId };
    if (decoded.role) {
      req.user.role = decoded.role; // Preserve role if present
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    // Log the error for debugging
    console.error('Auth Middleware error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};