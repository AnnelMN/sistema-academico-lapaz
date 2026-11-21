const prisma = require('../lib/prisma');
const { iaHabilitada, PREDICCION_NO_DISPONIBLE, filtroModeloVigente } = require('../services/iaService');
const { periodoActivo, hoyLaPaz } = require('../services/periodoService');
const { DIMENSIONES, cargarContexto, valorAsistencia, notaAnual } = require('../services/calificacionService');
const QRCode = require('qrcode');
const qrAsistencia = require('../services/qrAsistenciaService');

// Obtener el perfil del estudiante autenticado
const getEstudiantePerfil = async (usuarioId) => {
  const estudiante = await prisma.estudiante.findUnique({
    where: { usuarioId }
  });
  if (!estudiante) {
    throw new Error('Perfil de estudiante no encontrado');
  }
  return estudiante;
};

// 1. Mis notas por materia: las 4 dimensiones del trimestre, el detalle de MIS
//    casillas (nunca las notas de compañeros), los totales de cada trimestre y la
//    nota anual. GET /api/estudiante/notas?trimestre=1|2|3 (por defecto, el activo)
exports.getMisNotas = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);
    const activo = await periodoActivo();
    const gestion = activo?.gestion ?? Number(hoyLaPaz().slice(0, 4));

    let trimestre = activo?.trimestre ?? 1;
    if (req.query.trimestre !== undefined) {
      trimestre = Number(req.query.trimestre);
      if (![1, 2, 3].includes(trimestre)) {
        return res.status(400).json({ error: 'El trimestre debe ser 1, 2 o 3' });
      }
    }

    const programaciones = await prisma.materiaProgramada.findMany({
      where: { cursoId: estudiante.cursoId, gestion },
      select: {
        id: true,
        materia: { select: { nombre: true } },
        docente: { select: { usuario: { select: { nombre: true } } } },
      },
      orderBy: { materia: { nombre: 'asc' } },
    });

    const notasDelAnio = await prisma.nota.findMany({
      where: { estudianteId: estudiante.id, materiaProgramadaId: { in: programaciones.map((p) => p.id) } },
    });

    const materias = [];
    for (const p of programaciones) {
      const ctx = await cargarContexto(p.id, trimestre);
      const misValores = ctx.valoresPorEstudiante.get(estudiante.id) || new Map();
      const miAsistencia = ctx.asistenciaPorEstudiante.get(estudiante.id) || { presentes: 0, justificados: 0, ausentes: 0, total: 0 };
      const valorAsis = valorAsistencia(miAsistencia);

      // Detalle de MIS casillas: cuenta = si entra al promedio
      const detalle = {};
      for (const dimension of DIMENSIONES) {
        detalle[dimension] = ctx.casillas
          .filter((c) => c.dimension === dimension)
          .map((c) => {
            if (c.esAsistencia) {
              return { nombre: 'Asistencia', esAsistencia: true, valor: valorAsis, cuenta: valorAsis !== null, asistencia: miAsistencia };
            }
            const cuenta = ctx.casillasCalificadas.has(c.id);
            const propio = misValores.get(c.id);
            return { nombre: c.nombre, orden: c.orden, esAsistencia: false, valor: cuenta ? (propio ?? 0) : null, cuenta };
          });
      }

      const nota = ctx.notasPorEstudiante.get(estudiante.id);
      const porTrimestre = { 1: null, 2: null, 3: null };
      for (const n of notasDelAnio.filter((x) => x.materiaProgramadaId === p.id)) porTrimestre[n.trimestre] = n.total;
      const totales = Object.values(porTrimestre).filter((t) => t !== null);

      materias.push({
        materiaProgramadaId: p.id,
        materia: p.materia.nombre,
        docente: p.docente?.usuario?.nombre || null,
        nota: nota ? {
          ser: nota.ser, saber: nota.saber, hacer: nota.hacer,
          autoevaluacion: nota.autoevaluacion, total: nota.total, aprobado: nota.aprobado,
        } : null,
        detalle,
        trimestres: porTrimestre,
        anual: { nota: notaAnual(totales), trimestresConNota: totales.length, parcial: totales.length < 3 },
      });
    }

    const config = await prisma.configuracion.findFirst();
    res.json({
      gestion,
      trimestre,
      trimestreActivo: activo?.trimestre ?? null,
      umbralAprobacion: config?.umbralAprobacion || 51,
      materias,
    });
  } catch (error) {
    console.error('Error en getMisNotas:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

// 2. Obtener horario semanal
exports.getMiHorario = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);

    const programaciones = await prisma.materiaProgramada.findMany({
      where: { cursoId: estudiante.cursoId },
      include: {
        materia: true,
        // Solo el nombre del docente: nunca devolver el objeto usuario completo
        // (contiene password y twoFactorSecret).
        docente: {
          select: {
            usuario: { select: { nombre: true } }
          }
        }
      }
    });

    res.json(programaciones);
  } catch (error) {
    console.error('Error en getMiHorario:', error);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

// 3. Obtener resumen de asistencia
exports.getMiAsistencia = async (req, res) => {
  try {
    const estudiante = await getEstudiantePerfil(req.user.id);

    // Obtener todas las asistencias del estudiante
    const asistencias = await prisma.asistencia.findMany({
      where: { estudianteId: estudiante.id },
      include: {
        materiaProgramada: {
          include: { materia: true }
        }
      }
    });

    // Agrupar por materia
    const resumen = {};
    asistencias.forEach(a => {
      const materiaNombre = a.materiaProgramada.materia.nombre;
      if (!resumen[materiaNombre]) {
        resumen[materiaNombre] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
      }
      resumen[materiaNombre].total++;
      if (a.estado === 'PRESENTE') resumen[materiaNombre].presentes++;
      if (a.estado === 'AUSENTE') resumen[materiaNombre].ausentes++;
      if (a.estado === 'JUSTIFICADO') resumen[materiaNombre].justificados++;
    });

    // Formatear a array
    const data = Object.keys(resumen).map(materia => {
      const stats = resumen[materia];
      // Según reglas, J no cuenta como falta. El % es sobre el total.
      // El justificado cuenta como asistencia
      const porcentaje = stats.total > 0 ? Math.round(((stats.presentes + stats.justificados) / stats.total) * 100) : 0;
      return {
        materia,
        faltas: stats.ausentes,
        porcentaje,
        total: stats.total
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getMiAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
};

// 4. Obtener última predicción de riesgo IA
exports.getMiPrediccion = async (req, res) => {
  try {
    // Predicciones pausadas: no se envían datos de riesgo
    if (!iaHabilitada()) {
      return res.json({ ...PREDICCION_NO_DISPONIBLE, nivelRiesgo: 'NO_DISPONIBLE' });
    }

    const estudiante = await getEstudiantePerfil(req.user.id);

    const prediccion = await prisma.prediccionRiesgo.findFirst({
      where: { estudianteId: estudiante.id, ...filtroModeloVigente() },   // solo del modelo vigente
      orderBy: { generadoEn: 'desc' }
    });

    // Si no hay predicción todavía, devolver un estado por defecto
    if (!prediccion) {
      return res.json({
        nivelRiesgo: 'SIN_EVALUAR',
        probabilidad: 0,
        promedioNotas: 0,
        porcentajeAsistencia: 0,
        trimestre: 1
      });
    }

    res.json(prediccion);
  } catch (error) {
    console.error('Error en getMiPrediccion:', error);
    res.status(500).json({ error: 'Error al obtener predicción IA' });
  }
};

// 6. Mi código QR de asistencia (dinámico: cambia cada 30 s).
//    GET /api/estudiante/qr → { imagen (PNG en data URL), segundosRestantes, expiraEn }
//    El QR solo contiene un código aleatorio firmado por el servidor; ningún dato personal.
exports.getMiQR = async (req, res) => {
  try {
    if (!qrAsistencia.qrConfigurado()) {
      return res.status(503).json({ error: 'El código QR de asistencia no está disponible por ahora' });
    }
    const estudiante = await getEstudiantePerfil(req.user.id);
    const { contenido, segundosRestantes, expiraEn } = qrAsistencia.generarContenido(estudiante.id);
    const imagen = await QRCode.toDataURL(contenido, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
    res.set('Cache-Control', 'no-store');
    res.json({ imagen, segundosRestantes, expiraEn });
  } catch (error) {
    if (error.message === 'Perfil de estudiante no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error en getMiQR:', error);
    res.status(500).json({ error: 'No se pudo generar tu código QR' });
  }
};
