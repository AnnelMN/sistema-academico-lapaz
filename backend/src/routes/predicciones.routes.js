const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getPrediccionesEstudiantes } = require('../controllers/predicciones.controller');

router.use(authMiddleware(['DIRECTOR']));

router.get('/estudiantes', getPrediccionesEstudiantes);

module.exports = router;
