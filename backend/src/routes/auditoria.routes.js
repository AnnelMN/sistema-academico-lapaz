const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAuditoria } = require('../controllers/auditoria.controller');

// Historial de cambios en notas y asistencia: solo el Director, solo lectura
router.get('/', authMiddleware(['DIRECTOR']), getAuditoria);

module.exports = router;
