const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getNotificaciones, enviarManual } = require('../controllers/notificaciones.controller');

router.use(authMiddleware(['DIRECTOR']));

router.get('/', getNotificaciones);
router.post('/manual', enviarManual);

module.exports = router;
