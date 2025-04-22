import { IDoctor } from '../../model/doctorModel';

export interface IDoctorRepository {
  findByEmail(email: string): Promise<IDoctor | null>;
  // findByLicense(licenseNumber: string): Promise<IDoctor | null>;
  findById(id: string): Promise<IDoctor | null>;
  create(doctor: Partial<IDoctor>): Promise<IDoctor>;
}