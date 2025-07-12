import Patient, { Iuser } from '../../../model/userModel';
import Doctor, { IDoctor } from '../../../model/doctorModel';
import Admin, { IAdmin } from '../../../model/adminModel';

export class AdminRepository {
  
  //admin
 findAdminByEmail(email: string): Promise<IAdmin | null> {
      return Admin.findOne({ email }).exec();
  }
  //

  findAllPatients(): Promise<Iuser[]> {
    return Patient.find().select('-password').exec();
  }

  updatePatient(id: string, update: Partial<Iuser>): Promise<Iuser | null> {
    return Patient.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  findAllDoctors(): Promise<IDoctor[]> {
    return Doctor.find().select('-password').exec();
  }

  updateDoctor(id: string, update: Partial<IDoctor>): Promise<IDoctor | null> {
    return Doctor.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}