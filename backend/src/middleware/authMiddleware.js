const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Verifica el JWT y, en cada solicitud, confirma en la base de datos que el
// usuario sigue existiendo y activo. El rol se toma de la base de datos (no del
// token), así desactivar a un usuario o cambiar su rol tiene efecto inmediato.
const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Los tokens temporales (2FA, recuperación) no sirven para rutas normales
    if (decoded.purpose || !decoded.id) {
      return res.status(401).json({ error: 'Token temporal no autorizado para esta ruta' });
    }

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, rol: true, activo: true, tokenVersion: true },
      });

      if (!usuario || !usuario.activo) {
        return res.status(401).json({ error: 'Sesión no válida: usuario inexistente o desactivado' });
      }

      // Revocación de sesiones: si la versión del token no coincide con la del
      // usuario (cambió su contraseña o su rol, lo desactivaron o cerró todas
      // sus sesiones), el token ya no vale. Tokens antiguos sin versión = 0.
      if ((decoded.tv ?? 0) !== usuario.tokenVersion) {
        return res.status(401).json({ error: 'Sesión cerrada: vuelva a iniciar sesión' });
      }

      req.user = { id: usuario.id, email: usuario.email, rol: usuario.rol };

      if (roles.length && !roles.includes(req.user.rol)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error('Error verificando usuario en authMiddleware:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

module.exports = authMiddleware;
