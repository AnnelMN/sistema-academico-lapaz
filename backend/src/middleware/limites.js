const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ════════════════════════════════════════════════════════════════════
// Límites de solicitudes (hallazgos LB-09 / control 11 y 12).
// Ojo: en el colegio muchos estudiantes comparten la MISMA IP pública, por eso
// los límites por IP son amplios y en autenticación solo cuentan los FALLOS.
// En Railway se activa 'trust proxy' (server.js) para leer la IP real.
// ════════════════════════════════════════════════════════════════════

const comunes = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
};

// Todas las rutas de la API: protección general contra abuso
const limiteGeneral = rateLimit({
  ...comunes,
  windowMs: 5 * 60 * 1000,
  limit: 1500,
  message: { error: 'Demasiadas solicitudes desde esta red. Intente en unos minutos.' },
});

// Login, 2FA y recuperación de contraseña: solo cuentan los intentos fallidos
const limiteAutenticacion = rateLimit({
  ...comunes,
  windowMs: 15 * 60 * 1000,
  limit: 50,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos fallidos desde esta red. Intente en 15 minutos.' },
});

// Envío manual de correos a tutores: por usuario autenticado (evita spam a padres)
const limiteCorreos = rateLimit({
  ...comunes,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => (req.user?.id ? `usuario:${req.user.id}` : ipKeyGenerator(req.ip)),
  message: { error: 'Se alcanzó el límite de correos manuales por hora. Intente más tarde.' },
});

module.exports = { limiteGeneral, limiteAutenticacion, limiteCorreos };
