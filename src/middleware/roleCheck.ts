import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const verifyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Assuming Bearer token

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      if (!process.env.JWT_ACCESS_SECRET) {
        return res.status(500).json({ message: 'JWT secret is not configured' });
      }
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { id: string; role: string };

      if (roles.includes(decoded.role)) {

        // req.user = { id: decoded.id };
        req.user = { id: decoded.id };


        next(); // User has the correct role, proceed to the next middleware/route
      } else {
        res.status(403).json({ message: 'Forbidden: You do not have the required role' });
      }

    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token ..from role check' });
    }
  };
};

export default verifyRole;
