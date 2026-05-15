const express = require('express');
const router = express.Router();
const academicoController = require('../controllers/academico.controller');
const programacionesController = require('../controllers/programaciones.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Solo el rol ADMINISTRATIVO puede modificar la malla curricular, pero DIRECTOR también podría ver. 
// Dejamos ADMINISTRATIVO por el requerimiento.
router.use(authMiddleware(['ADMINISTRATIVO', 'DIRECTOR']));

// Materias
router.get('/materias', academicoController.getMaterias);
router.post('/materias', academicoController.createMateria);

// Cursos
router.get('/cursos', academicoController.getCursos);

// Docentes (lista filtrada)
router.get('/docentes', academicoController.getDocentes);

// Programaciones (Horarios)
router.get('/programaciones', programacionesController.getProgramaciones);
router.post('/programaciones', programacionesController.createProgramacion);

module.exports = router;
