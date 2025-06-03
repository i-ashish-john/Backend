import express from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { AuthController } from '../../controller/patient/implementation/authController';
import { AuthService } from '../../service/patient/implementation/authService';
import { AuthRepository } from '../../repository/patient/implementation/authRepository';
import { TokenRepository } from '../../repository/patient/implementation/tokenRepository';

import verifyRole from '../../middleware/roleCheck'

import { NextFunction } from "express";


const router = express.Router();

const authRepository = new AuthRepository();
const tokenRepository = new TokenRepository();

const authService = new AuthService(authRepository, tokenRepository);

const authController = new AuthController(authService);

// Auth routes
router.post('/signup', (req, res, next) => authController.signup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/auth/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refresh(req, res, next));

router.get("/dashboard", authenticate,verifyRole(['patient']),(req,res,next)=> authController.getDashboard(req, res, next));

router.get('/auth/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
//password reset route 27-31
router.post('/forgotpassword', (req, res) => authController.forgotPassword(req, res));
router.get('/auth/verifyresettoken', (req, res) => authController.verifyResetToken(req, res));
//passing here after clicking the link
router.post('/resetpassword', (req, res) => authController.resetPassword(req, res));

//signup otp
router.post('/auth/send-signup-otp', (req, res) => authController.sendSignupOtp(req, res));
router.post('/auth/verify-signup-otp', (req, res) => authController.verifySignupOtp(req, res));

router.post("/auth/resend-signup-otp",(req, res) => authController.resendSignupOtp(req, res));



router.get("/profile", authenticate, verifyRole(["patient"]), (req, res, next) => authController.getProfile(req, res, next));
router.put("/profile", authenticate, verifyRole(["patient"]), (req, res, next) => authController.updateProfile(req, res, next));

export default router;