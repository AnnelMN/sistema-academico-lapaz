const prisma = require('./prisma');

// Comprobaciones de autorización por objeto (regla de negocio 9):
// cada docente solo accede a sus materias y a los estudiantes de esos cursos;
// el Director tiene acceso global.
// Devuelven { error, status } si se debe rechazar la solicitud.

const esIdValido = (valor) => typeof valor === 'string' && valor.trim().length > 0;

// Verifica que la programación exista y, si el usuario no es Director,
// que pertenezca al docente autenticado.
async function verificarAccesoProgramacion(user, materiaProgramadaId) {
  if (!esIdValido(materiaProgramadaId)) {
    return { status: 400, error: 'materiaProgramadaId inválido' };
  }

  const programacion = await prisma.materiaProgramada.findUnique({
    where: { id: materiaProgramadaId },
    select: { id: true, docenteId: true, cursoId: true, gestion: true },
  });

  if (!programacion) {
    return { status: 404, error: 'Programación no encontrada' };
  }

  if (user.rol === 'DIRECTOR') {
    return { programacion };
  }

  const docente = await prisma.docente.findUnique({
    where: { usuarioId: user.id },
    select: { id: true },
  });

  if (!docente) {
    return { status: 404, error: 'Perfil de docente no encontrado' };
  }

  if (programacion.docenteId !== docente.id) {
    return { status: 403, error: 'No tienes acceso a esta materia' };
  }

  return { programacion, docente };
}

// Verifica que todos los estudiantes indicados pertenezcan al curso dado y,
// salvo que se indique soloActivos: false, que estén ACTIVOS. Un estudiante
// desactivado no recibe notas ni asistencia nuevas; su historial se conserva
// (solo el Director lo consulta).
async function verificarEstudiantesEnCurso(estudianteIds, cursoId, { soloActivos = true } = {}) {
  const ids = [...new Set(estudianteIds)];

  if (ids.length === 0 || !ids.every(esIdValido)) {
    return { status: 400, error: 'estudianteId inválido' };
  }

  const enCurso = await prisma.estudiante.count({
    where: { id: { in: ids }, cursoId, ...(soloActivos ? { usuario: { activo: true } } : {}) },
  });

  if (enCurso !== ids.length) {
    return {
      status: 403,
      error: soloActivos
        ? 'El estudiante no pertenece al curso de esta materia o está desactivado'
        : 'El estudiante no pertenece al curso de esta materia',
    };
  }

  return {};
}

module.exports = {
  esIdValido,
  verificarAccesoProgramacion,
  verificarEstudiantesEnCurso,
};
