const prisma = require('../lib/prisma');
const { evaluarRiesgo } = require('../services/riesgoService');
const emailService = require('../services/emailService');
const {
  esIdValido,
  verificarAccesoProgramacion,
  verificarEstudiantesEnCurso,
} = require('../lib/acceso');
const {
  hoyLaPaz, esFechaISOValida, esDiaHabil, periodoDeFecha, periodoActivo, rangoDeTrimestre,
} = require('../services/periodoService');
const { recalcularNotas } = require('../services/calificacionService');
const { accionDe, registrarCambios } = require('../services/auditoriaService');
const qrAsistencia = require('../services/qrAsistenciaService');

const ESTADOS_VALIDOS = new Set(['PRESENTE', 'AUSENTE', 'JUSTIFICADO']);
const MAX_REGISTROS_POR_LISTA = 200;

// Asistencia = (PRESENTE + JUSTIFICADO) / registros × 100 (el justificado cuenta como asistencia)
const contarAsistencia = (registros) => {
  const presentes = registros.filter(a => a.estado === 'PRESENTE').length;
  const justificados = registros.filter(a => a.estado === 'JUSTIFICADO').length;
  const faltas = registros.filter(a => a.estado === 'AUSENTE').length;
  const total = registros.length;
  return {
    presentes,
    justificados,
    faltas,
    total,
    porcentaje: total > 0 ? ((presentes + justificados) / total) * 100 : null,
  };
};

// ─────────────────────────────────────────────
// GET /api/asistencia/estudiantes
// Retorna estudiantes del curso con su estado del día y estadísticas acumuladas
// ─────────────────────────────────────────────
exports.getEstudiantesConAsistencia = async (req, res) => {
  try {
    const { materiaProgramadaId, fecha } = req.query;

    if (!materiaProgramadaId || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros: materiaProgramadaId y fecha' });
    }

    // Los docentes solo ven sus propias programaciones; el Director puede ver cualquiera
    const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
    if (acceso.error) {
      return res.status(acceso.status).json({ error: acceso.error });
    }
    const { programacion } = acceso;

    if (!esFechaISOValida(fecha)) {
      return res.status(400).json({ error: 'Fecha inválida (formato AAAA-MM-DD)' });
    }

    // Fecha normalizada al inicio del día UTC
    const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha}T23:59:59.999Z`);

    // Las estadísticas se calculan sobre el trimestre de la fecha consultada
    // (igual que la casilla de asistencia de SER); si la fecha no cae en ningún
    // trimestre, se usan todos los registros.
    const periodo = await periodoDeFecha(fecha);
    const rango = periodo ? await rangoDeTrimestre(periodo.gestion, periodo.trimestre) : null;

    // Obtener todos los estudiantes del curso con sus asistencias
    const estudiantes = await prisma.estudiante.findMany({
      where: { cursoId: programacion.cursoId },
      include: {
        usuario: { select: { nombre: true } },
        asistencias: {
          where: {
            materiaProgramadaId,
            ...(rango ? { fecha: { gte: rango.inicio, lte: rango.fin } } : {}),
          }
        }
      },
      orderBy: { usuario: { nombre: 'asc' } }
    });

    // Para cada estudiante, obtener el estado del día seleccionado y las estadísticas
    const data = estudiantes.map(est => {
      const todasLasAsistencias = est.asistencias;

      // Estado del día consultado
      const asistenciaHoy = todasLasAsistencias.find(a => {
        const d = new Date(a.fecha);
        return d >= fechaInicio && d <= fechaFin;
      });

      // Estadísticas del trimestre (el justificado cuenta como asistencia)
      const stats = contarAsistencia(todasLasAsistencias);

      return {
        id: est.id,
        nombre: est.usuario.nombre,
        estadoHoy: asistenciaHoy ? asistenciaHoy.estado : null,
        totalRegistros: stats.total,
        presentes: stats.presentes,
        justificados: stats.justificados,
        faltas: stats.faltas,
        porcentajeAsistencia: stats.porcentaje === null ? null : Math.round(stats.porcentaje), // null = sin registros aún
        trimestre: periodo?.trimestre ?? null,
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error en getEstudiantesConAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes con asistencia' });
  }
};

// Reglas de fecha para REGISTRAR asistencia (registro manual y por QR):
// válida, de lunes a viernes, no futura, del trimestre activo y de la gestión de la materia.
// Devuelve { periodo } o { status, error }.
async function validarFechaDeRegistro(fecha, materiaProgramadaId) {
  if (!esFechaISOValida(fecha)) {
    return { status: 400, error: 'Fecha inválida (formato AAAA-MM-DD)' };
  }
  if (!esDiaHabil(fecha)) {
    return { status: 400, error: 'Solo se registra asistencia de lunes a viernes' };
  }
  if (fecha > hoyLaPaz()) {
    return { status: 400, error: 'No se puede registrar asistencia de una fecha futura' };
  }
  const [periodo, activo] = await Promise.all([periodoDeFecha(fecha), periodoActivo()]);
  if (!periodo) {
    return { status: 400, error: 'La fecha no pertenece a ningún trimestre (vacaciones o día de descanso)' };
  }
  if (!activo || periodo.gestion !== activo.gestion || periodo.trimestre !== activo.trimestre) {
    return { status: 403, error: 'Solo se registra asistencia del trimestre activo' };
  }
  const programacionGestion = await prisma.materiaProgramada.findUnique({
    where: { id: materiaProgramadaId }, select: { gestion: true },
  });
  if (programacionGestion.gestion !== periodo.gestion) {
    return { status: 400, error: 'La fecha no corresponde a la gestión de esta materia' };
  }
  return { periodo };
}

// Después de guardar asistencia (manual o por QR): recalcula la casilla de
// asistencia de SER, consulta la IA (si está habilitada) y revisa el límite de faltas.
async function procesarTrasRegistro(materiaProgramadaId, periodo, estudianteIds) {
  // Actualizar la casilla de asistencia de SER en las notas del trimestre
  try {
    await recalcularNotas(materiaProgramadaId, periodo.trimestre, { estudianteIds });
  } catch (calcError) {
    console.error('Error recalculando notas tras la asistencia:', calcError.message);
  }

  // --- INTEGRACION CON IA Y NOTIFICACIONES ---
  const config = await prisma.configuracion.findFirst();
  const limiteFaltas = config?.limiteFaltas || 25;

  for (const estudianteId of estudianteIds) {
    try {
      // 1. Obtener datos del estudiante
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        include: { usuario: true }
      });
      if (!estudiante) continue;

      // 2. Faltas del estudiante en esta materia (para el aviso de exceso de faltas)
      const asistencias = await prisma.asistencia.findMany({
        where: { estudianteId, materiaProgramadaId }
      });
      const faltas = contarAsistencia(asistencias).faltas;

      // 3. Predicción de riesgo con TODAS las materias del estudiante (mismo servicio
      //    que el registro de notas; pausado mientras IA_HABILITADA no sea "true")
      try {
        await evaluarRiesgo({ estudianteId, materiaProgramadaId, trimestre: periodo.trimestre, origen: 'asistencia' });
      } catch (iaError) {
        console.warn(`No se pudo evaluar el riesgo del estudiante ${estudianteId}:`, iaError.message);
      }

      // 4. Verificar exceso de faltas
      if (faltas > limiteFaltas && estudiante.emailTutor) {
        const yaNotificado = await prisma.notificacion.findFirst({
          where: {
            estudianteId,
            tipo: 'EXCESO_FALTAS',
            estadoEnvio: 'ENVIADO'
          }
        });
        if (!yaNotificado) {
          try {
            const programacion = await prisma.materiaProgramada.findUnique({
              where: { id: materiaProgramadaId },
              include: { materia: true }
            });
            const materiaNombre = programacion?.materia?.nombre || 'General';

            await emailService.enviarAlertaInasistencia(
              estudiante.usuario.nombre,
              materiaNombre,
              faltas,
              limiteFaltas,
              estudiante.emailTutor
            );
            await prisma.notificacion.create({
              data: {
                estudianteId,
                tipo: 'EXCESO_FALTAS',
                emailDestino: estudiante.emailTutor,
                estadoEnvio: 'ENVIADO',
                mensaje: `Exceso de faltas: ${faltas}/${limiteFaltas} en ${materiaNombre}`
              }
            });
          } catch (emailError) {
            console.error('Error enviando correo EXCESO_FALTAS:', emailError.message);
            await prisma.notificacion.create({
              data: {
                estudianteId,
                tipo: 'EXCESO_FALTAS',
                emailDestino: estudiante.emailTutor || 'desconocido',
                estadoEnvio: 'FALLIDO',
                mensaje: 'No se pudo enviar el correo de alerta' // el detalle técnico queda solo en el log del servidor
              }
            }).catch(() => {});
          }
        }
      }
    } catch (estError) {
      console.error(`Error procesando estudiante ${estudianteId}:`, estError.message);
    }
  }
}

// ─────────────────────────────────────────────
// POST /api/asistencia
// Registra o actualiza la asistencia de todos los estudiantes para una fecha
// ─────────────────────────────────────────────
exports.registrarAsistencia = async (req, res) => {
  try {
    const { materiaProgramadaId, fecha, registros } = req.body;
    // registros = [{ estudianteId, estado }]

    if (!materiaProgramadaId || !fecha || !registros || !Array.isArray(registros)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que la materia le pertenece al docente autenticado
    const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
    if (acceso.error) {
      return res.status(acceso.status).json({ error: acceso.error });
    }

    // Verificar que todos los estudiantes pertenecen al curso de esta materia
    // (evita registrar asistencia y disparar correos a tutores de otros cursos)
    if (!registros.every(r => r && typeof r === 'object')) {
      return res.status(400).json({ error: 'Formato de registros inválido' });
    }
    const pertenencia = await verificarEstudiantesEnCurso(
      registros.map(r => r.estudianteId),
      acceso.programacion.cursoId
    );
    if (pertenencia.error) {
      return res.status(pertenencia.status).json({ error: pertenencia.error });
    }

    if (registros.length > MAX_REGISTROS_POR_LISTA) {
      return res.status(400).json({ error: `Máximo ${MAX_REGISTROS_POR_LISTA} estudiantes por lista` });
    }
    if (!registros.every(r => ESTADOS_VALIDOS.has(r.estado))) {
      return res.status(400).json({ error: 'Estado inválido: use PRESENTE, AUSENTE o JUSTIFICADO' });
    }

    // Reglas de fecha: válida, de lunes a viernes, no futura y dentro del trimestre activo
    const reglaFecha = await validarFechaDeRegistro(fecha, materiaProgramadaId);
    if (reglaFecha.error) {
      return res.status(reglaFecha.status).json({ error: reglaFecha.error });
    }
    const { periodo } = reglaFecha;

    const fechaDate = new Date(`${fecha}T12:00:00.000Z`); // Mediodía UTC para evitar problemas de zona horaria

    // Guardado + auditoría en la misma transacción (quién cambió qué asistencia)
    const resultados = await prisma.$transaction(async (tx) => {
      const previas = new Map((await tx.asistencia.findMany({
        where: { materiaProgramadaId, fecha: fechaDate, estudianteId: { in: registros.map(r => r.estudianteId) } },
        select: { estudianteId: true, estado: true },
      })).map(a => [a.estudianteId, a.estado]));

      const guardados = [];
      for (const { estudianteId, estado } of registros) {
        guardados.push(await tx.asistencia.upsert({
          where: {
            estudianteId_materiaProgramadaId_fecha: {
              estudianteId,
              materiaProgramadaId,
              fecha: fechaDate
            }
          },
          update: { estado },
          create: {
            estudianteId,
            materiaProgramadaId,
            fecha: fechaDate,
            estado
          }
        }));
      }

      await registrarCambios(tx, registros
        .filter(({ estudianteId, estado }) => previas.get(estudianteId) !== estado)
        .map(({ estudianteId, estado }) => {
          const anterior = previas.get(estudianteId) ?? null;
          return {
            entidad: 'ASISTENCIA', accion: accionDe(anterior, estado), materiaProgramadaId, estudianteId,
            usuarioId: req.user.id,
            valorAnterior: anterior === null ? null : { fecha, estado: anterior },
            valorNuevo: { fecha, estado },
          };
        }));
      return guardados;
    }, { maxWait: 10000, timeout: 30000 });

    // Obtener todos los estudiantes unicos afectados
    const estudianteIds = [...new Set(registros.map(r => r.estudianteId))];

    await procesarTrasRegistro(materiaProgramadaId, periodo, estudianteIds);

    res.json({ guardados: resultados.length, fecha: fechaDate });
  } catch (error) {
    console.error('Error en registrarAsistencia:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
};

// ─────────────────────────────────────────────
// GET /api/asistencia/historial
// Historial de asistencias de un estudiante en una materia
// ─────────────────────────────────────────────
exports.getHistorialAsistencia = async (req, res) => {
  try {
    const { materiaProgramadaId } = req.query;
    let { estudianteId } = req.query;

    if (!esIdValido(materiaProgramadaId)) {
      return res.status(400).json({ error: 'Falta el parámetro materiaProgramadaId' });
    }

    if (req.user.rol === 'ESTUDIANTE') {
      // El estudiante solo puede ver su propio historial: el id sale del token, no de la URL
      const propio = await prisma.estudiante.findUnique({
        where: { usuarioId: req.user.id },
        select: { id: true },
      });
      if (!propio) {
        return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
      }
      if (estudianteId && estudianteId !== propio.id) {
        return res.status(403).json({ error: 'No tienes acceso a este historial' });
      }
      estudianteId = propio.id;
    } else {
      if (!esIdValido(estudianteId)) {
        return res.status(400).json({ error: 'Faltan parámetros: estudianteId y materiaProgramadaId' });
      }

      // Profesor: solo sus materias; Director: cualquiera
      const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
      if (acceso.error) {
        return res.status(acceso.status).json({ error: acceso.error });
      }

      const pertenencia = await verificarEstudiantesEnCurso([estudianteId], acceso.programacion.cursoId);
      if (pertenencia.error) {
        return res.status(pertenencia.status).json({ error: pertenencia.error });
      }
    }

    const historial = await prisma.asistencia.findMany({
      where: { estudianteId, materiaProgramadaId },
      orderBy: { fecha: 'desc' }
    });

    res.json(historial);
  } catch (error) {
    console.error('Error en getHistorialAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener historial de asistencia' });
  }
};

// ─────────────────────────────────────────────
// POST /api/asistencia/qr   (solo PROFESOR)
// Registra PRESENTE de HOY escaneando el QR dinámico del estudiante.
// Body: { materiaProgramadaId, codigo }
// Nunca modifica un registro existente (si ya tiene asistencia hoy, lo informa).
// ─────────────────────────────────────────────
exports.registrarAsistenciaQR = async (req, res) => {
  try {
    const { materiaProgramadaId, codigo } = req.body || {};

    if (!qrAsistencia.qrConfigurado()) {
      return res.status(503).json({ error: 'El registro por QR no está configurado en el servidor' });
    }

    // 1. La materia debe ser del docente autenticado
    const acceso = await verificarAccesoProgramacion(req.user, materiaProgramadaId);
    if (acceso.error) {
      return res.status(acceso.status).json({ error: acceso.error });
    }

    // 2. Solo la fecha de HOY (La Paz), con las mismas reglas que el registro manual
    const fecha = hoyLaPaz();
    const reglaFecha = await validarFechaDeRegistro(fecha, materiaProgramadaId);
    if (reglaFecha.error) {
      return res.status(reglaFecha.status).json({ error: reglaFecha.error });
    }
    const { periodo } = reglaFecha;

    // 3. Identificar al estudiante (el código lo valida SOLO el servidor)
    const respuestaInvalido = () => res.status(400).json({
      resultado: 'INVALIDO',
      error: 'Código QR inválido o vencido. Pide al estudiante que abra su QR otra vez.',
    });
    if (!qrAsistencia.esFormatoValido(codigo)) return respuestaInvalido();

    const candidatos = await prisma.estudiante.findMany({
      where: { usuario: { activo: true } },
      select: { id: true, cursoId: true },
    });
    const estudianteId = qrAsistencia.identificar(codigo, candidatos.map((c) => c.id));
    if (!estudianteId) {
      console.warn(`QR de asistencia rechazado (docente ${req.user.id}, materia ${materiaProgramadaId})`);
      return respuestaInvalido();
    }

    // 4. Debe estar inscrito en el curso de esta materia (sin revelar datos de otros cursos)
    const cursoDelEstudiante = candidatos.find((c) => c.id === estudianteId).cursoId;
    if (cursoDelEstudiante !== acceso.programacion.cursoId) {
      return res.status(403).json({
        resultado: 'NO_INSCRITO',
        error: 'Este estudiante no está inscrito en esta materia',
      });
    }

    // 5. Registrar PRESENTE (o informar que ya tenía asistencia hoy) + auditoría
    const fechaDate = new Date(`${fecha}T12:00:00.000Z`); // mismo criterio que el registro manual
    let registro;
    try {
      registro = await prisma.$transaction((tx) => qrAsistencia.registrarPresente(tx, {
        estudianteId, materiaProgramadaId, fecha, fechaDate, usuarioId: req.user.id,
      }));
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      // Dos lecturas simultáneas del mismo QR: la otra ya lo registró
      const actual = await prisma.asistencia.findUnique({
        where: { estudianteId_materiaProgramadaId_fecha: { estudianteId, materiaProgramadaId, fecha: fechaDate } },
        select: { estado: true },
      });
      registro = { creado: false, estado: actual?.estado ?? 'PRESENTE' };
    }

    // 6. Mismo proceso posterior que el registro manual (casilla de SER, IA, faltas)
    if (registro.creado) {
      await procesarTrasRegistro(materiaProgramadaId, periodo, [estudianteId]);
    }

    // 7. Resumen de la sesión (hoy, esta materia)
    const [estudiante, inscritos, registrados] = await Promise.all([
      prisma.estudiante.findUnique({ where: { id: estudianteId }, select: { usuario: { select: { nombre: true } } } }),
      prisma.estudiante.count({ where: { cursoId: acceso.programacion.cursoId } }),
      prisma.asistencia.count({ where: { materiaProgramadaId, fecha: fechaDate } }),
    ]);

    res.json({
      resultado: registro.creado ? 'REGISTRADO' : 'YA_REGISTRADO',
      estudiante: { id: estudianteId, nombre: estudiante.usuario.nombre },
      estado: registro.estado,
      fecha,
      resumen: { inscritos, registrados, pendientes: Math.max(inscritos - registrados, 0) },
    });
  } catch (error) {
    console.error('Error en registrarAsistenciaQR:', error);
    res.status(500).json({ error: 'Error al registrar la asistencia por QR' });
  }
};
