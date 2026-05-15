const express = require('express');
const router = express.Router();
const { getUsuarios, createUsuario, updateUsuario, toggleEstado } = require('../controllers/usuarios.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes - only DIRECTOR can access
router.use(authMiddleware(['DIRECTOR']));

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.patch('/:id/estado', toggleEstado);

module.exports = router;
