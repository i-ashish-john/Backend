import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  _id: string;
  // specialization: string;
  // licenseNumber: string;
  // phoneNumber?: string;
  // address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);