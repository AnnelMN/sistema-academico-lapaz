const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getNotificaciones, enviarManual } = require('../controllers/notificaciones.controller');
const { limiteCorreos } = require('../middleware/limites');

router.use(authMiddleware(['DIRECTOR']));

router.get('/', getNotificaciones);
// Máximo 30 correos manuales por hora por usuario (evita spam a los padres)
router.post('/manual', limiteCorreos, enviarManual);

module.exports = router;
