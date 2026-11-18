require('dotenv').config();
const { aplicarValidacionEntorno, origenesPermitidos } = require('./config/entorno');

// Antes de nada: en producción no arranca con configuración insegura o incompleta
aplicarValidacionEntorno();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const academicoRoutes = require('./routes/academico.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const prediccionesRoutes = require('./routes/predicciones.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

// CORS: solo los orígenes de FRONTEND_URL (nunca '*')
app.use(cors({ origin: origenesPermitidos() }));
// Límite explícito del cuerpo JSON: 1 MB alcanza para guardar de una sola vez
// la planilla de notas más grande (≈ 8 800 casillas); el valor por defecto
// de Express (100 KB) rechazaba planillas de cursos grandes.
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/academico', academicoRoutes);
app.use('/api/notas', require('./routes/notas.routes'));
app.use('/api/asistencia', require('./routes/asistencia.routes'));
app.use('/api/estudiante', require('./routes/estudiante.routes'));
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/predicciones', prediccionesRoutes);
app.use('/api/reportes', reportesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  // Errores al leer el cuerpo de la solicitud: son del cliente, no del servidor
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Formato de datos inválido' });
  }
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
