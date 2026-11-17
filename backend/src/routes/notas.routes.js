const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notas.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Consultas: PROFESOR (solo sus materias) y DIRECTOR (todas, solo lectura)
router.get('/mis-materias', authMiddleware(['PROFESOR', 'DIRECTOR']), notasController.getMisMaterias);
router.get('/periodo-actual', authMiddleware(['PROFESOR', 'DIRECTOR']), notasController.getPeriodoActual);
router.get('/planilla', authMiddleware(['PROFESOR', 'DIRECTOR']), notasController.getPlanilla);

// Registro de notas: solo el PROFESOR de la materia (el Director solo ve)
router.put('/casillas', authMiddleware(['PROFESOR']), notasController.guardarCasillas);
router.put('/calificaciones', authMiddleware(['PROFESOR']), notasController.guardarCalificaciones);

module.exports = router;
