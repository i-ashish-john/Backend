import express from "express";
import { signup, login, logout, refresh } from "../../controller/patient/implementation/authController";
import { authenticate } from "../../middleware/authMiddleware";

const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh", refresh);

export default router;