const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudiante.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger todas las rutas para que solo el rol ESTUDIANTE pueda acceder
router.use(authMiddleware(['ESTUDIANTE']));

router.get('/notas', estudianteController.getMisNotas);
router.get('/horario', estudianteController.getMiHorario);
router.get('/asistencia', estudianteController.getMiAsistencia);
router.get('/prediccion', estudianteController.getMiPrediccion);

module.exports = router;
