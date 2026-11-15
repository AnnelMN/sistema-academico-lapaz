const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getReporteConsolidado } = require('../controllers/reportes.controller');

router.use(authMiddleware(['DIRECTOR']));

router.get('/consolidado', getReporteConsolidado);

module.exports = router;
