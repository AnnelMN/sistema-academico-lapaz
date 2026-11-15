require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const academicoRoutes = require('./routes/academico.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const prediccionesRoutes = require('./routes/predicciones.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

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
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
