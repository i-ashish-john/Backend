import jwt from 'jsonwebtoken';
import { AdminRepository } from '../../../repository/admin/implementation/adminRepository';
import { IAdmin } from '../../../model/adminModel';

export interface LoginResult {
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

export class AdminService {
  private repo = new AdminRepository();
  private JWT_SECRET: string;

  constructor() {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set');
    }
    this.JWT_SECRET = process.env.JWT_ACCESS_SECRET;
  }


async loginAdmin(email: string, password: string) {
  try{

    //1. Fetch the admin document
    const admin: IAdmin | null = await this.repo.findAdminByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }


    //2. Compare the password
 const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }


    //3.Build payload and token
  const id = (admin._id as { toString: () => string }).toString();
    const accessToken = jwt.sign(
      { id, role: admin.role },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );


    //4.Return shape matches your controller expectations
     return {
      admin: {
        id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      accessToken,
    };

    // const accessToken = jwt.sign({ id: admin._id.toString(), role: admin.role }, this.JWT_SECRET, { expiresIn: '1h' });
    // return { admin: { id: admin._id.toString(), name: admin.name, email: admin.email, role: admin.role }, accessToken };
  }catch(error) {
    console.error('Admin login error:', error);
    throw new Error('Server error during admin login');
  }
  }
  getAllPatients() {
    return this.repo.findAllPatients();
  }

  setPatientBlockStatus(id: string, blocked: boolean) {
    return this.repo.updatePatient(id, { blocked });
  }

  getAllDoctors() {
    return this.repo.findAllDoctors();
  }

  setDoctorBlockStatus(id: string, blocked: boolean) {
    return this.repo.updateDoctor(id, { blocked });
  }
}


