const prisma = require('../lib/prisma');

const RIESGO_ORDEN = {
  RIESGO_ALTO: 0,
  RIESGO_MEDIO: 1,
  SIN_RIESGO: 2,
};

const getPrediccionesEstudiantes = async (req, res) => {
  try {
    const { cursoId, nivelRiesgo, trimestre } = req.query;

    const predicciones = await prisma.prediccionRiesgo.findMany({
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

module.exports = {
  getPrediccionesEstudiantes,
};
