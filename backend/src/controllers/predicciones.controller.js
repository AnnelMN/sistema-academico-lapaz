const prisma = require('../lib/prisma');
const { iaHabilitada, PREDICCION_NO_DISPONIBLE, filtroModeloVigente } = require('../services/iaService');
const { verificarAccesoProgramacion } = require('../lib/acceso');
const { periodoActivo, hoyLaPaz } = require('../services/periodoService');

// GET /api/predicciones/estado — cualquier usuario autenticado puede saber si están disponibles
const getEstadoPredicciones = (req, res) => {
  res.json(iaHabilitada() ? { disponible: true } : PREDICCION_NO_DISPONIBLE);
};

const RIESGO_ORDEN = {
  RIESGO_ALTO: 0,
  RIESGO_MEDIO: 1,
  SIN_RIESGO: 2,
};

const getPrediccionesEstudiantes = async (req, res) => {
  try {
    // Predicciones pausadas: no se envían datos de riesgo
    if (!iaHabilitada()) {
      return res.json(PREDICCION_NO_DISPONIBLE);
    }

    const { cursoId, nivelRiesgo, trimestre } = req.query;

    const predicciones = await prisma.prediccionRiesgo.findMany({
      where: filtroModeloVigente(),   // solo predicciones del modelo vigente
      orderBy: { generadoEn: 'desc' },
      include: {
        estudiante: {
          include: {
            usuario: { select: { nombre: true, activo: true } },
            curso: { select: { nivel: true, paralelo: true } },
          },
        },
      },
    });

    const ultimasPorEstudiante = new Map();
    for (const prediccion of predicciones) {
      if (!ultimasPorEstudiante.has(prediccion.estudianteId)) {
        ultimasPorEstudiante.set(prediccion.estudianteId, prediccion);
      }
    }

    let datos = [...ultimasPorEstudiante.values()].filter(
      (p) => p.estudiante.usuario.activo
    );

    if (cursoId) {
      datos = datos.filter((p) => p.estudiante.cursoId === cursoId);
    }

    if (nivelRiesgo) {
      datos = datos.filter((p) => p.nivelRiesgo === nivelRiesgo);
    }

    if (trimestre) {
      datos = datos.filter((p) => String(p.trimestre) === String(trimestre));
    }

    datos.sort((a, b) => {
      const ordenA = RIESGO_ORDEN[a.nivelRiesgo] ?? 99;
      const ordenB = RIESGO_ORDEN[b.nivelRiesgo] ?? 99;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (b.probabilidad || 0) - (a.probabilidad || 0);
    });

    res.json(
      datos.map((p) => ({
        id: p.id,
        estudianteId: p.estudianteId,
        nombre: p.estudiante.usuario.nombre,
        curso: `${p.estudiante.curso.nivel}° ${p.estudiante.curso.paralelo}`,
        cursoId: p.estudiante.cursoId,
        trimestre: p.trimestre,
        nivelRiesgo: p.nivelRiesgo,
        probabilidad: p.probabilidad,
        promedioNotas: p.promedioNotas,
        porcentajeAsistencia: p.porcentajeAsistencia,
        generadoEn: p.generadoEn,
      }))
    );
  } catch (error) {
    console.error('Error fetching predicciones:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/predicciones/profesor?materiaProgramadaId=   (solo PROFESOR)
// Riesgo de los estudiantes de los cursos donde el docente dicta clases, en la
// gestión actual. Nunca incluye estudiantes de otros cursos. Con
// materiaProgramadaId (que debe ser del docente) se limita a ese curso.
// Incluye a quienes aún no tienen predicción, para que el docente vea a todos.
const getPrediccionesProfesor = async (req, res) => {
  try {
    if (!iaHabilitada()) {
      return res.json(PREDICCION_NO_DISPONIBLE);
    }

    const docente = await prisma.docente.findUnique({ where: { usuarioId: req.user.id }, select: { id: true } });
    if (!docente) {
      return res.status(404).json({ error: 'Perfil de docente no encontrado' });
    }

    const activo = await periodoActivo();
    const gestion = activo?.gestion ?? Number(hoyLaPaz().slice(0, 4));
    const materias = await prisma.materiaProgramada.findMany({
      where: { docenteId: docente.id, gestion },
      select: {
        id: true, cursoId: true,
        materia: { select: { nombre: true } },
        curso: { select: { nivel: true, paralelo: true } },
      },
      orderBy: [{ curso: { nivel: 'asc' } }, { curso: { paralelo: 'asc' } }],
    });

    let cursoIds = [...new Set(materias.map((m) => m.cursoId))];
    const { materiaProgramadaId } = req.query;
    if (materiaProgramadaId !== undefined && materiaProgramadaId !== '') {
      // Solo una materia del propio docente (403 si es de otro)
      const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
      if (acceso.error) return res.status(acceso.status).json({ error: acceso.error });
      cursoIds = [acceso.programacion.cursoId];
    }

    const estudiantes = cursoIds.length === 0 ? [] : await prisma.estudiante.findMany({
      where: { cursoId: { in: cursoIds }, usuario: { activo: true } },
      select: {
        id: true, cursoId: true,
        usuario: { select: { nombre: true } },
        curso: { select: { nivel: true, paralelo: true } },
      },
    });

    // Última predicción del modelo vigente de cada estudiante
    const predicciones = estudiantes.length === 0 ? [] : await prisma.prediccionRiesgo.findMany({
      where: { estudianteId: { in: estudiantes.map((e) => e.id) }, ...filtroModeloVigente() },
      orderBy: { generadoEn: 'desc' },
      distinct: ['estudianteId'],
      select: {
        estudianteId: true, nivelRiesgo: true, probabilidad: true, promedioNotas: true,
        porcentajeAsistencia: true, trimestre: true, generadoEn: true,
      },
    });
    const porEstudiante = new Map(predicciones.map((p) => [p.estudianteId, p]));

    const datos = estudiantes.map((e) => {
      const p = porEstudiante.get(e.id);
      return {
        estudianteId: e.id,
        nombre: e.usuario.nombre,
        curso: `${e.curso.nivel}° ${e.curso.paralelo}`,
        cursoId: e.cursoId,
        nivelRiesgo: p?.nivelRiesgo ?? null,          // null = todavía sin predicción
        probabilidad: p?.probabilidad ?? null,
        promedioNotas: p?.promedioNotas ?? null,      // promedio general (todas sus materias)
        porcentajeAsistencia: p?.porcentajeAsistencia ?? null,
        trimestre: p?.trimestre ?? null,
        generadoEn: p?.generadoEn ?? null,
      };
    }).sort((a, b) => {
      const oa = RIESGO_ORDEN[a.nivelRiesgo] ?? 3;
      const ob = RIESGO_ORDEN[b.nivelRiesgo] ?? 3;
      if (oa !== ob) return oa - ob;
      if ((b.probabilidad ?? 0) !== (a.probabilidad ?? 0)) return (b.probabilidad ?? 0) - (a.probabilidad ?? 0);
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    res.json({
      disponible: true,
      gestion,
      trimestreActivo: activo?.trimestre ?? null,
      materias: materias.map((m) => ({
        id: m.id, materia: m.materia.nombre, curso: `${m.curso.nivel}° ${m.curso.paralelo}`,
      })),
      resumen: {
        total: datos.length,
        alto: datos.filter((d) => d.nivelRiesgo === 'RIESGO_ALTO').length,
        medio: datos.filter((d) => d.nivelRiesgo === 'RIESGO_MEDIO').length,
        sinRiesgo: datos.filter((d) => d.nivelRiesgo === 'SIN_RIESGO').length,
        sinPrediccion: datos.filter((d) => d.nivelRiesgo === null).length,
      },
      estudiantes: datos,
    });
  } catch (error) {
    console.error('Error en getPrediccionesProfesor:', error);
    res.status(500).json({ error: 'Error al obtener las predicciones' });
  }
};

module.exports = {
  getEstadoPredicciones,
  getPrediccionesEstudiantes,
  getPrediccionesProfesor,
};
