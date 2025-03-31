import { createUser, findUserByEmail,findUserByUsername } from "../repository/authRepository";
import { IuserInput, Iuser } from "../model/user";

export const registerUser = async (userData: IuserInput): Promise<Iuser> => {
    try {
        // Input validation
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error("Invalid user data provided");
        }

               // email exist or not
               const existingUserByEmail = await findUserByEmail(userData.email);
               if (existingUserByEmail) {
                   throw new Error('Email already registered');
               }
       
               //  username  exists or not
               const existingUserByUsername = await findUserByUsername(userData.username);
               if (existingUserByUsername) {
                   throw new Error('Username already taken');
               }
       
        
        const newUser = await createUser(userData);//(here creating user)
        return newUser;

    } catch (error: any) {
        throw new Error(error.message || 'Registration failed');
        //  console.error('Frontend error:', error.response?.data || error.message);

    }
};