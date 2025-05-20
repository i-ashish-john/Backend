import { Request, Response } from 'express';
import { AdminService } from '../../../service/admin/implementation/adminService';
import { HttpStatusCode } from '../../../config/ HttpStatusCode.enum';
// import jwt from 'jsonwebtoken';
// import Admin from '../../../model/adminModel';
import Patient from '../../../model/userModel'; // Assuming you have a Patient model
import Doctor from '../../../model/doctorModel';   // Assuming you have a Doctor model
import cookie from 'cookie';

export class AdminController {
  private adminService = new AdminService();

  async loginAdmin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
    if (!email || !password)
      return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: 'Missing credentials' });

    const { admin, accessToken } = await this.adminService.loginAdmin(email, password);
    // set HTTP-only cookie
    res.setHeader('Set-Cookie', cookie.serialize('adminAccessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    }));

    return res.status(HttpStatusCode.OK).json({ success: true, data: admin, accessToken });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error during admin login',
      });
    }
  }
 async logoutAdmin(req: Request, res: Response) {
    // clear cookie
    res.setHeader('Set-Cookie', cookie.serialize('adminAccessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    }));

    return res.status(HttpStatusCode.OK).json({ success: true, message: 'Logged out' });
  }

  async listPatients(req: Request, res: Response) {
    try {
      const patients = await Patient.find().select('_id email role blocked name');
      const formattedPatients = patients.map((patient: { _id: any; email: string; role?: string; blocked?: boolean; name?: string }) => ({
        _id: patient._id.toString(),
        email: patient.email,
        role: patient.role || 'patient',
        blocked: patient.blocked || false,
        name: patient.name || 'N/A', // Ensure 'name' exists in the model
      }));
      res.status(HttpStatusCode.OK).json({ success: true, data: formattedPatients });
    } catch (error) {
      console.error('Error listing patients:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch patients',
      });
    }
  }

  async blockPatient(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await Patient.findByIdAndUpdate(id, { blocked: true });
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Patient blocked' });
    } catch (error) {
      console.error('Error blocking patient:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to block patient',
      });
    }
  }

  async unblockPatient(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await Patient.findByIdAndUpdate(id, { blocked: false });
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Patient unblocked' });
    } catch (error) {
      console.error('Error unblocking patient:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to unblock patient',
      });
    }
  }

  async listDoctors(req: Request, res: Response) {
    try {
      const doctors = await Doctor.find().select('_id email role blocked name');
      const formattedDoctors = doctors.map(doctor => ({
        _id: doctor._id.toString(),
        email: doctor.email,
        role: doctor.role || 'doctor',
        blocked: doctor.blocked || false,
        name: doctor.name || 'N/A',
      }));
      res.status(HttpStatusCode.OK).json({ success: true, data: formattedDoctors });
    } catch (error) {
      console.error('Error listing doctors:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch doctors',
      });
    }
  }

  async blockDoctor(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await Doctor.findByIdAndUpdate(id, { blocked: true });
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Doctor blocked' });
    } catch (error) {
      console.error('Error blocking doctor:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to block doctor',
      });
    }
  }

  async unblockDoctor(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await Doctor.findByIdAndUpdate(id, { blocked: false });
      res.status(HttpStatusCode.OK).json({ success: true, message: 'Doctor unblocked' });
    } catch (error) {
      console.error('Error unblocking doctor:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to unblock doctor',
      });
    }
  }
}