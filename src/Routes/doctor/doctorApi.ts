import express from 'express';
import { DoctorController } from '../../controller/doctor/implementation/doctorController';
import { DoctorService } from '../../service/doctor/implementation/doctorService'; // Assumed service layer
import { TokenRepository } from '../../repository/doctor/implementation/tokenRepository';

const router = express.Router();

import { DoctorRepository } from '../../repository/doctor/implementation/doctorRepository'; // Assumed repository layer

const doctorRepository = new DoctorRepository(); // Create an instance of the repository
const tokenRepository = new TokenRepository();

const doctorService = new DoctorService(doctorRepository, tokenRepository);
const doctorController = new DoctorController(doctorService);

router.post('/signup', (req, res) => doctorController.signup(req, res));
router.post('/login', (req, res) => doctorController.login(req, res));
router.post('/logout', (req, res) => doctorController.logout(req, res));
router.get('/me', (req, res) => doctorController.getMe(req, res));


router.post('/send-otp', (req, res) => doctorController.sendSignupOTP(req, res));
router.post('/resend-otp', (req, res) => doctorController.resendSignupOTP(req, res));
router.post('/verify-otp', (req, res) => doctorController.verifySignupOTP(req, res));

export default router;