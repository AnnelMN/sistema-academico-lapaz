require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const academicoRoutes = require('./routes/academico.routes');

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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
