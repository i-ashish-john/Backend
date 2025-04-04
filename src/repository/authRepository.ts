import User, { Iuser, IuserInput } from "../model/userModel";
import mongoose from "mongoose";

export const createUser = async (userData: IuserInput): Promise<Iuser> => {
  try {
    const result = await User.create(userData);
    console.log('Created user:', result);
    return result;
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<Iuser | null> => {
  try {
    return await User.findOne({ email }).select('+password');
  } catch (error: any) {
    console.error('Error finding user by email:', error.message);
    throw error;
  }
};

export const findUserByUsername = async (username: string): Promise<Iuser | null> => {
  try {
    return await User.findOne({ username });
  } catch (error: any) {
    console.error('Error finding user by username:', error.message);
    throw error;
  }
};

export const findUserById = async (id: string): Promise<Iuser | null> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await User.findById(id);
  } catch (error: any) {
    console.error('Error finding user by ID:', error.message);
    throw error;
  }
};

export const updateUser = async (id: string, updateData: Partial<IuserInput>): Promise<Iuser | null> => {
  try {
    // Prevent password updates through this method for security
    if (updateData.password) {
      delete updateData.password;
    }
    
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    throw error;
  }
};