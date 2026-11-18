const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const twoFactorController = require('../controllers/twoFactor.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/2fa/authenticate', authController.authenticate);
router.post('/2fa/setup-authenticate', authController.setupAuthenticate);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware(), authController.getMe);
router.post('/cerrar-sesiones', authMiddleware(), authController.cerrarSesiones);
router.post('/2fa/setup', authMiddleware(), twoFactorController.setup);
router.post('/2fa/verify-setup', authMiddleware(), twoFactorController.verifySetup);
router.post('/2fa/disable', authMiddleware(), twoFactorController.disable);

module.exports = router;
