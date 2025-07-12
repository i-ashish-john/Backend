import { IAuthRepository } from "../iauthRepository";
import User, { Iuser, IuserInput } from "../../../model/userModel";
import mongoose from "mongoose";
import { HttpStatusCode } from "../../../config/HttpStatusCode.enum";

export class AuthRepository implements IAuthRepository {
  async createUser(userData: IuserInput): Promise<Iuser> {
    try {
      return await User.create(userData);
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

  async findUserByEmail(email: string): Promise<Iuser | null> {
    try {
      return await User.findOne({ email }).select('+password');
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

  async findUserByUsername(username: string): Promise<Iuser | null> {
    try {
      return await User.findOne({ username });
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

async findUserById(id: string): Promise<Iuser | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await User.findById(id).select("-password -blocked -resetToken -resetTokenExpiresAt");
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }     
  }
  async updateUser(id: string, updateData: Partial<IuserInput>): Promise<Iuser | null> {
    try {
      if (updateData.password) delete updateData.password;
      return await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<Iuser | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      
      return await User.findByIdAndUpdate(
        id, 
        { $set: { password: hashedPassword } }, 
        { new: true }
      );
    } catch (error: any) {
      throw { 
        message: error.message, 
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR 
      };
    }
  }

}

