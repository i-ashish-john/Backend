// authService.ts
import { createUser, findUserByEmail } from "../repository/authRepository";
import { IuserInput, Iuser } from "../model/user";

export const registerUser = async (userData: IuserInput): Promise<Iuser> => {
    try {
        // Input validation
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error("Invalid user data provided");
        }

        // Check if user already exists
        const existingUser = await findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Create new user
        const newUser = await createUser(userData);
        return newUser;
    } catch (error: any) {
        throw new Error(error.message || 'Registration failed');
        //  console.error('Frontend error:', error.response?.data || error.message);

    }
};