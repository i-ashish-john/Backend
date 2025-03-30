// authRepository.ts
import User, { Iuser, IuserInput } from "../model/user";

export const createUser = async (userData: IuserInput): Promise<Iuser> => {
    try {
        const result = await User.create(userData);
        console.log('Created user:', result);
        return result;
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        throw error;
    }
}

export const findUserByEmail = async (email: string): Promise<Iuser | null> => {
    try {
        return await User.findOne({ email }).select('+password');
    } catch (error: any) {
        console.error('Error finding user:', error.message);
        throw error;
    }
};