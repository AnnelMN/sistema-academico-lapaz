const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.get(
  '/estudiantes',
  authMiddleware(['PROFESOR', 'DIRECTOR']),
  asistenciaController.getEstudiantesConAsistencia
);

router.post(
  '/',
  authMiddleware(['PROFESOR']),
  asistenciaController.registrarAsistencia
);

// Registro rápido por QR dinámico del estudiante (solo marca PRESENTE de hoy)
router.post(
  '/qr',
  authMiddleware(['PROFESOR']),
  asistenciaController.registrarAsistenciaQR
);

router.get(
  '/historial',
  authMiddleware(['PROFESOR', 'DIRECTOR', 'ESTUDIANTE']),
  asistenciaController.getHistorialAsistencia
);

module.exports = router;
