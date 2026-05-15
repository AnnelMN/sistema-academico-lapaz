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

router.get(
  '/historial',
  authMiddleware(['PROFESOR', 'DIRECTOR', 'ESTUDIANTE']),
  asistenciaController.getHistorialAsistencia
);

module.exports = router;
