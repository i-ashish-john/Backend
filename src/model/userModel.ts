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
  role: 'patient' | 'doctor' | 'admin'; 
  blocked: boolean; // Blocked status
  resetToken?: string; //password reset
  resetTokenExpiresAt?: Date; 
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new mongoose.Schema({

  username: {  type: String,
               required: true,
               unique: true 
             },

  email: {  type: String,
            required: true,
            unique: true 
        },

  password:{ type: String,
            required: true,
            select: false
         },

  role: {  type: String, 
           enum: ['patient', 'doctor', 'admin'],
           default: 'patient'// Default role
         }, 
         
         blocked: { type: Boolean, default: false },

  resetToken: { type: String }, // Store reset token
  resetTokenExpiresAt: { type: Date },// Token expiration
},
 {
  timestamps: true
}
 );

export default mongoose.model<Iuser>("User", userSchema);

