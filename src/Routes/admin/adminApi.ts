import express from 'express';
import { authenticate } from '../../middleware/AdminMiddleware/authenticate';
import { verifyRole } from '../../middleware/AdminMiddleware/verifyRole';
import { AdminController } from '../../controller/admin/implementation/adminController';
import { AuthenticatedRequest } from '../../middleware/DoctorMiddleware/DrAuthMiddleware';

const router = express.Router();
const adminController = new AdminController();

// Admin login route
router.post('/login', (req, res) => adminController.loginAdmin(req, res));

router.post('/logout', (req, res) => adminController.logoutAdmin(req, res));

// List all patients and their status
router.get('/patients', authenticate, verifyRole(['admin']), (req, res) => adminController.listPatients(req, res));
// Block a patient
router.put('/patients/:id/block', authenticate, verifyRole(['admin']), (req, res) => adminController.blockPatient(req, res));
// Unblock a patient
router.put('/patients/:id/unblock', authenticate, verifyRole(['admin']), (req, res) => adminController.unblockPatient(req, res));

// List all doctors and their status
router.get('/doctors', authenticate, verifyRole(['admin']), (req, res) => adminController.listDoctors(req, res));
// Block a doctor
router.put('/doctors/:id/block', authenticate, verifyRole(['admin']), (req, res) => adminController.blockDoctor(req, res));
// Unblock a doctor
router.put('/doctors/:id/unblock', authenticate, verifyRole(['admin']), (req, res) => adminController.unblockDoctor(req, res));

router.get(
  '/me',
  authenticate,                // will 401 if no/invalid cookie
  (req, res) => {
    // `authenticate` attached `req.user`
    const { id, role } = (req as AuthenticatedRequest).user!;
    // fetch any other fields you need, or stash in cookie
    return res.json({ success: true, data: { id, role } });
  }
);

export default router;