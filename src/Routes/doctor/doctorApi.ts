import express from 'express';
import { NextFunction, Request, Response } from 'express';
// import cookieParser from 'cookie-parser';
import { DoctorController } from '../../controller/doctor/implementation/doctorController';
import { DoctorService } from '../../service/doctor/implementation/doctorService';
import { DoctorRepository } from '../../repository/doctor/implementation/doctorRepository';
import { TokenRepository } from '../../repository/doctor/implementation/tokenRepository';
import { authenticate } from '../../middleware/DoctorMiddleware/DrAuthMiddleware';
import { verifyRole } from '../../middleware/DoctorMiddleware/DrRoleCheck';



import Patient from '../../model/userModel';

const router = express.Router();

const doctorRepository = new DoctorRepository();
const tokenRepository = new TokenRepository();
const doctorService = new DoctorService(doctorRepository, tokenRepository);
const doctorController = new DoctorController(doctorService);

router.post('/signup', (req, res) => doctorController.signup(req, res));
router.post('/login', (req, res) => doctorController.login(req, res));
router.post('/send-otp', (req, res) => doctorController.sendSignupOTP(req, res));
router.post('/resend-otp', (req, res) => doctorController.resendSignupOTP(req, res));
router.post('/verify-otp', (req, res) => doctorController.verifySignupOTP(req, res));
router.post('/forgot-password', (req, res) => doctorController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => doctorController.resetPassword(req, res));

// 
router.post('/logout', authenticate, verifyRole(['doctor']), (req, res) => doctorController.logout(req, res));
router.get('/me', authenticate, verifyRole(['doctor']), (req, res,next) => doctorController.getMe(req, res, next));
//
router.get(   // temporary  
  '/patients', // finding all patients
  authenticate,
  verifyRole(['doctor']),
  async (req, res) => {
    const list = await Patient.find().select('_id email name blocked');
    res.json({ success: true, data: list });
  }
);
router.put('/profile', authenticate, verifyRole(['doctor']), (req, res) => doctorController.updateProfile(req, res));
export default router;
