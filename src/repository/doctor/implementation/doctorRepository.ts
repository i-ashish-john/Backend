import { IDoctorRepository } from '../idoctorRepository';
import { IDoctor } from '../../../model/doctorModel';
import Doctor from '../../../model/doctorModel'; // MongoDB model

export class DoctorRepository implements IDoctorRepository {

  async findByEmail(email: string): Promise<IDoctor | null> {
    return await Doctor.findOne({ email }).exec();
  }

  async findByLicense(licenseNumber: string): Promise<IDoctor | null> {
    return await Doctor.findOne({ licenseNumber }).exec();
  }

  async findById(id: string): Promise<IDoctor | null> {
    return await Doctor.findById(id).exec();
  }

  async create(doctor: Partial<IDoctor>): Promise<IDoctor> {
    const newDoctor = new Doctor(doctor);
    return await newDoctor.save();
  }
  
  async updatePassword(id: string, hashed: string): Promise<void> {
    await Doctor.findByIdAndUpdate(id, { password: hashed }).exec();
  }
  
  async update(doctor: IDoctor): Promise<IDoctor> {
  return await doctor.save();
}

}