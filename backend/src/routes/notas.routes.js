const express = require('express');
const router = express.Router();
const notasController = require('../controllers/notas.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas de notas requieren rol PROFESOR o DIRECTOR
router.use(authMiddleware(['PROFESOR', 'DIRECTOR']));

router.get('/mis-materias', notasController.getMisMaterias);
router.get('/estudiantes', notasController.getNotasEstudiantes);
router.post('/', notasController.upsertNota);

module.exports = router;
