const prisma = require('../lib/prisma');
const { iaHabilitada, PREDICCION_NO_DISPONIBLE } = require('../services/iaService');

const getReporteConsolidado = async (req, res) => {
  try {
    const { cursoId, materiaId, trimestre, gestion } = req.query;

    const config = await prisma.configuracion.findFirst();
    const umbralAprobacion = config?.umbralAprobacion || 51;
    const gestionReporte = gestion ? parseInt(gestion) : config?.gestionActual || new Date().getFullYear();

    const notas = await prisma.nota.findMany({
      where: {
        trimestre: trimestre ? parseInt(trimestre) : undefined,
        materiaProgramada: {
          gestion: gestionReporte,
          ...(cursoId ? { cursoId } : {}),
          ...(materiaId ? { materiaId } : {}),
        },
      },
      include: {
        estudiante: {
          include: {
            usuario: { select: { nombre: true } },
            curso: { select: { nivel: true, paralelo: true } },
          },
        },
        materiaProgramada: {
          include: { materia: true, curso: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
      take: 500,
    });

    const estudianteIds = [...new Set(notas.map((n) => n.estudianteId))];

    // Predicciones pausadas: no se consultan ni se envían datos de riesgo
    const prediccionesDisponibles = iaHabilitada();
    const predicciones = !prediccionesDisponibles ? [] : await prisma.prediccionRiesgo.findMany({
      where: {
        estudianteId: { in: estudianteIds.length ? estudianteIds : [] },
        ...(trimestre ? { trimestre: parseInt(trimestre) } : {}),
      },
      orderBy: { generadoEn: 'desc' },
    });

    const ultimaPrediccionPorEstudiante = new Map();
    for (const p of predicciones) {
      if (!ultimaPrediccionPorEstudiante.has(p.estudianteId)) {
        ultimaPrediccionPorEstudiante.set(p.estudianteId, p);
      }
    }

    const riesgoAltoIds = new Set(
      [...ultimaPrediccionPorEstudiante.values()].filter(
        (p) => p.nivelRiesgo === 'RIESGO_ALTO'
      ).map((p) => p.estudianteId)
    );

    const asistencias = await prisma.asistencia.findMany({
      where: {
        materiaProgramada: {
          gestion: gestionReporte,
          ...(cursoId ? { cursoId } : {}),
          ...(materiaId ? { materiaId } : {}),
        },
      },
    });

    const asistenciasValidas = asistencias.filter(
      (a) => a.estado === 'PRESENTE' || a.estado === 'JUSTIFICADO'
    ).length;
    const asistenciaPromedio =
      asistencias.length > 0 ? (asistenciasValidas / asistencias.length) * 100 : 0;

    const totalNotas = notas.length;
    const promedioNotas =
      totalNotas > 0
        ? notas.reduce((sum, n) => sum + n.total, 0) / totalNotas
        : 0;
    const aprobados = notas.filter((n) => n.total >= umbralAprobacion).length;
    const reprobados = totalNotas - aprobados;

    const notasEstudiante = new Map();
    for (const n of notas) {
      if (!notasEstudiante.has(n.estudianteId)) {
        notasEstudiante.set(n.estudianteId, []);
      }
      notasEstudiante.get(n.estudianteId).push(n);
    }

    const resumen = {
      totalEstudiantesConNotas: notasEstudiante.size,
      totalNotas,
      promedioNotas: Math.round(promedioNotas * 100) / 100,
      aprobados,
      reprobados,
      asistenciaPromedio: Math.round(asistenciaPromedio * 100) / 100,
      riesgoAlto: prediccionesDisponibles ? riesgoAltoIds.size : null,
      prediccionesDisponibles,
      ...(prediccionesDisponibles ? {} : { mensajePredicciones: PREDICCION_NO_DISPONIBLE.mensaje }),
      umbralAprobacion,
      gestion: gestionReporte,
      trimestre: trimestre ? parseInt(trimestre) : null,
    };

    const agrupar = (items, clave, labelFn) => {
      const grupos = new Map();
      for (const n of items) {
        const estudiante = n.estudiante;
        const claveValor = clave(n);
        if (!grupos.has(claveValor)) {
          grupos.set(claveValor, {
            label: labelFn(n),
            estudiantes: new Set(),
            notas: 0,
            suma: 0,
            aprobados: 0,
            reprobados: 0,
            riesgoAlto: 0,
          });
        }
        const g = grupos.get(claveValor);
        g.notas += 1;
        g.suma += n.total;
        if (n.total >= umbralAprobacion) g.aprobados += 1;
        else g.reprobados += 1;
        g.estudiantes.add(n.estudianteId);
        if (riesgoAltoIds.has(n.estudianteId)) g.riesgoAlto += 1;
      }

      return [...grupos.entries()].map(([id, g]) => ({
        id,
        label: g.label,
        estudiantes: g.estudiantes.size,
        notasRegistradas: g.notas,
        promedio: g.notas > 0 ? Math.round((g.suma / g.notas) * 100) / 100 : 0,
        aprobados: g.aprobados,
        reprobados: g.reprobados,
        riesgoAlto: prediccionesDisponibles ? g.riesgoAlto : null,
      }));
    };

    const porCurso = agrupar(
      notas,
      (n) => n.estudiante.cursoId,
      (n) => `${n.estudiante.curso.nivel}° ${n.estudiante.curso.paralelo}`
    );

    const porMateria = agrupar(
      notas,
      (n) => n.materiaProgramada.materiaId,
      (n) => n.materiaProgramada.materia.nombre
    );

    const recientes = notas.slice(0, 30).map((n) => ({
      id: n.id,
      estudiante: n.estudiante.usuario.nombre,
      curso: `${n.estudiante.curso.nivel}° ${n.estudiante.curso.paralelo}`,
      materia: n.materiaProgramada.materia.nombre,
      trimestre: n.trimestre,
      total: n.total,
      aprobado: n.total >= umbralAprobacion,
      creadoEn: n.creadoEn,
    }));

    res.json({
      resumen,
      porCurso,
      porMateria,
      recientes,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Server error generating report' });
  }
};

module.exports = {
  getReporteConsolidado,
};
