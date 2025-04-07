import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../../../service/patient/authService";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }

        const { user, accessToken, refreshToken } = await registerUser({ username, email, password });
        
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                accessToken
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const { user, accessToken, refreshToken } = await loginUser(email, password);
        
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                accessToken
            }
        });
    } catch (error: any) {
        console.error('Login controller error:', error.message);
        return res.status(400).json({ 
            success: false, 
            message: error.message || 'Login failed' 
        });
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        await logoutUser(userId);
        
        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error: any) {
        console.error('Logout controller error:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Logout failed' 
        });
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ 
                success: false, 
                message: 'Refresh token not found' 
            });
        }

        const newAccessToken = await refreshAccessToken(refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error: any) {
        console.error('Token refresh controller error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: error.message || 'Token refresh failed' 
        });
    }
};