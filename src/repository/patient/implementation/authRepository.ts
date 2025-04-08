import { IAuthRepository } from "../iauthRepository";
import User, { Iuser, IuserInput } from "../../../model/userModel";
import mongoose from "mongoose";

export class AuthRepository implements IAuthRepository {
  async createUser(userData: IuserInput): Promise<Iuser> {
    try {
      const result = await User.create(userData);
      console.log('Created user:', result);
      return result;
    } catch (error: any) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<Iuser | null> {
    try {
      return await User.findOne({ email }).select('+password');
    } catch (error: any) {
      console.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  async findUserByUsername(username: string): Promise<Iuser | null> {
    try {
      return await User.findOne({ username });
    } catch (error: any) {
      console.error('Error finding user by username:', error.message);
      throw error;
    }
  }

  async findUserById(id: string): Promise<Iuser | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await User.findById(id);
    } catch (error: any) {
      console.error('Error finding user by ID:', error.message);
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<IuserInput>): Promise<Iuser | null> {
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
  }
}