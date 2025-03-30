import mongoose from "mongoose";
import {Schema,Document}  from "mongoose";
 

export interface IuserInput {
    username: string,
    email: string,
    password: string,
}

export interface Iuser extends Document, IuserInput {}

const UserSchema :Schema = new Schema (
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
      },
      { timestamps: true }
)
export default mongoose.model<Iuser>("user", UserSchema);
