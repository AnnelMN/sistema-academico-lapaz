const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getEstadoPredicciones, getPrediccionesEstudiantes } = require('../controllers/predicciones.controller');

// Estado de las predicciones: cualquier usuario autenticado
router.get('/estado', authMiddleware(), getEstadoPredicciones);

// Predicciones de todos los estudiantes: solo Director
router.get('/estudiantes', authMiddleware(['DIRECTOR']), getPrediccionesEstudiantes);

module.exports = router;
