// authController.ts
import { Request, Response, NextFunction } from "express";
import { registerUser } from "../service/authService";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }

        const newUser = await registerUser({ username, email, password });
        
        console.log("reache.......")

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error: any) {
        console.error('Signup controller error:', error.message);
        return res.status(400).json({ 
            success: false, 
            message: error.message || 'Registration failed' 
        });
    }
};