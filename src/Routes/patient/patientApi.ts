import express from "express";
import { signup, login, refreshToken, 
         logout, 
    getCurrentUser} from "../../controller/patient/implementation/authController";

import { authenticateJWT } from "../../middleware/authMiddleware";

const router = express.Router();

// Auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected route
router.get("/me", authenticateJWT, getCurrentUser);

export default router;