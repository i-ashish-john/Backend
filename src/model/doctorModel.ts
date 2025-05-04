import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  _id: string;
  role: 'doctor';
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
  role: { type: String, enum: ['doctor'], default: 'doctor' }, // Default role for doctors
}, { timestamps: true });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);