const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getEstadoPredicciones, getPrediccionesEstudiantes, getPrediccionesProfesor } = require('../controllers/predicciones.controller');

// Estado de las predicciones: cualquier usuario autenticado
router.get('/estado', authMiddleware(), getEstadoPredicciones);

// Predicciones de todos los estudiantes: solo Director
router.get('/estudiantes', authMiddleware(['DIRECTOR']), getPrediccionesEstudiantes);

// Predicciones de los estudiantes de SUS cursos: solo Profesor
router.get('/profesor', authMiddleware(['PROFESOR']), getPrediccionesProfesor);

module.exports = router;
