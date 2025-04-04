import mongoose from "mongoose";
import { Schema, Document } from "mongoose";

export interface IRefreshTokenInput {
  userId: mongoose.Types.ObjectId | string;
  token: string;
  expiresAt?: Date;
}

export interface IRefreshToken extends Document, IRefreshTokenInput {}

const RefreshTokenSchema: Schema = new Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'user', 
      required: true 
    },
    token: { 
      type: String, 
      required: true,
      unique: true 
    },
    expiresAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  { timestamps: true }
);

//  autodelete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshToken>("refreshToken", RefreshTokenSchema);

