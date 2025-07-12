import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  _id: string;
  role: 'doctor';
  blocked: boolean;
  specialization: string;
  licenseNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor'], default: 'doctor' },
  blocked: { type: Boolean, default: false },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);