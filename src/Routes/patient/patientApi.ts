import express from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { AuthController } from '../../controller/patient/implementation/authController';
import { AuthService } from '../../service/patient/implementation/authService';
import { AuthRepository } from '../../repository/patient/implementation/authRepository';
import { TokenRepository } from '../../repository/patient/implementation/tokenRepository';

const router = express.Router();

// Initialize repositories
const authRepository = new AuthRepository();
const tokenRepository = new TokenRepository();

// Initialize service with repositories
const authService = new AuthService(authRepository, tokenRepository);

// Initialize controller with service
const authController = new AuthController(authService);

// Auth routes
router.post('/signup', (req, res, next) => authController.signup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refresh(req, res, next));

export default router;