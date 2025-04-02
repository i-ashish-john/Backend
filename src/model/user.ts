// src/model/user.ts
import mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IuserInput {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface Iuser extends Document, IuserInput {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['patient', 'doctor', 'admin'], 
      default: 'patient' 
    }
  },
  { timestamps: true }
);

export default mongoose.model<Iuser>("user", UserSchema);