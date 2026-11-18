const prisma = require('../lib/prisma');
const { esIdValido } = require('../lib/acceso');
const { ENTIDADES } = require('../services/auditoriaService');

// GET /api/auditoria?materiaProgramadaId=&estudianteId=&entidad=&limite=
// Historial de cambios en notas y asistencia. Solo DIRECTOR (ver auditoria.routes.js).
// Solo lectura: no existe ninguna ruta para editar ni borrar la auditoría.
const getAuditoria = async (req, res) => {
  try {
    const { materiaProgramadaId, estudianteId, entidad } = req.query;
    const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 50, 1), 200);

    if (materiaProgramadaId !== undefined && !esIdValido(materiaProgramadaId)) {
      return res.status(400).json({ error: 'materiaProgramadaId inválido' });
    }
    if (estudianteId !== undefined && !esIdValido(estudianteId)) {
      return res.status(400).json({ error: 'estudianteId inválido' });
    }
    if (entidad !== undefined && !ENTIDADES.includes(entidad)) {
      return res.status(400).json({ error: `entidad debe ser una de: ${ENTIDADES.join(', ')}` });
    }

    const registros = await prisma.auditoriaCambio.findMany({
      where: {
        ...(materiaProgramadaId ? { materiaProgramadaId } : {}),
        ...(estudianteId ? { estudianteId } : {}),
        ...(entidad ? { entidad } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: limite,
    });

    // Nombres de quienes hicieron los cambios y de los estudiantes afectados
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: [...new Set(registros.map((r) => r.usuarioId))] } },
      select: { id: true, nombre: true, rol: true },
    });
    const estudiantes = await prisma.estudiante.findMany({
      where: { id: { in: [...new Set(registros.map((r) => r.estudianteId).filter(Boolean))] } },
      select: { id: true, usuario: { select: { nombre: true } } },
    });
    const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));
    const estudiantePorId = new Map(estudiantes.map((e) => [e.id, e.usuario.nombre]));

    res.json(registros.map((r) => ({
      id: r.id,
      fecha: r.creadoEn,
      entidad: r.entidad,
      accion: r.accion,
      materiaProgramadaId: r.materiaProgramadaId,
      estudiante: r.estudianteId ? estudiantePorId.get(r.estudianteId) || null : null,
      valorAnterior: r.valorAnterior,
      valorNuevo: r.valorNuevo,
      realizadoPor: usuarioPorId.get(r.usuarioId)?.nombre || 'Usuario eliminado',
      rol: usuarioPorId.get(r.usuarioId)?.rol || null,
    })));
  } catch (error) {
    console.error('Error obteniendo auditoría:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getAuditoria };
