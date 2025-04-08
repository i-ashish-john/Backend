  import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';

  declare global {  //   1. accesing the token from the request header(Access token) 
    namespace Express {
      interface Request {
        user?: {
          id: string;
        };
      }
    }
  }

  export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from  authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { userId: string };
      
      // Add the user ID to the request
      req.user = {
        id: decoded.userId
      };
      // console.log('logoutted');
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };