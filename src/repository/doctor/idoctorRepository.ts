import { IDoctor } from '../../model/doctorModel';

export interface IDoctorRepository {
  findByLicense(licenseNumber: any): unknown;
  update(doctor: IDoctor): IDoctor | PromiseLike<IDoctor>;
  updatePassword(arg0: string, hashed: string): unknown;
  findByEmail(email: string): Promise<IDoctor | null>;
  // findByLicense(licenseNumber: string): Promise<IDoctor | null>;
  findById(id: string): Promise<IDoctor | null>;
  create(doctor: Partial<IDoctor>): Promise<IDoctor>;
}