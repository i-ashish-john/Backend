import mongoose, { Document, Schema } from "mongoose";

export interface IuserInput {
  username: string;
  email: string;
  password: string;
}

export interface Iuser extends Document {
  username: string;
  email: string;
  password: string;
  resetToken?: string; // Added for password reset
  resetTokenExpiresAt?: Date; // Added for token expiration
}

const userSchema: Schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  resetToken: { type: String }, // Store reset token
  resetTokenExpiresAt: { type: Date },// Token expiration
},
 {
  timestamps: true
}
 );

export default mongoose.model<Iuser>("User", userSchema);