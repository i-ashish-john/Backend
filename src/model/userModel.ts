import mongoose, { Document, Schema } from "mongoose";

export interface IuserInput {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  profilePicture?: string;
  paymentDetails?: {
    method?: string;
    cardLast4?: string;
    billingAddress?: string;
  };
}

export interface Iuser extends Document {
  username: string;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  blocked: boolean;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  profilePicture?: string;
  totalAppointments: number;
  lastLogin?: Date;
  paymentDetails?: {
    method?: string;
    cardLast4?: string;
    billingAddress?: string;
  };
}

const userSchema: Schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    resetToken: { type: String },
    resetTokenExpiresAt: { type: Date },
    phoneNumber: { type: String, trim: true },
    dateOfBirth: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: { type: String, trim: true },
    profilePicture: { type: String, trim: true },
    totalAppointments: { type: Number, default: 0 },
    lastLogin: { type: Date },
    paymentDetails: {
      method: { type: String, trim: true },
      cardLast4: { type: String, trim: true },
      billingAddress: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<Iuser>("User", userSchema);