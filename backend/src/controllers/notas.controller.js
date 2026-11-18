const prisma = require('../lib/prisma');
const { verificarAccesoProgramacion, verificarEstudiantesEnCurso, esIdValido } = require('../lib/acceso');
const { periodoActivo } = require('../services/periodoService');
const {
  PESOS, DIMENSIONES, MAX_AUTOEVALUACION, MAX_CASILLAS,
  cargarContexto, calcularDesdeContexto, recalcularNotas,
} = require('../services/calificacionService');
const { evaluarRiesgo } = require('../services/riesgoService');
const { accionDe, registrarCambios } = require('../services/auditoriaService');

// ════════════════════════════════════════════════════════════════════
// Notas por casillas (escala SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5)
//   GET  /api/notas/mis-materias      PROFESOR (las suyas) · DIRECTOR (todas)
//   GET  /api/notas/periodo-actual    PROFESOR · DIRECTOR
//   GET  /api/notas/planilla          PROFESOR (las suyas) · DIRECTOR (solo ver)
//   PUT  /api/notas/casillas          solo PROFESOR, trimestre activo
//   PUT  /api/notas/calificaciones    solo PROFESOR, trimestre activo
// ════════════════════════════════════════════════════════════════════

const MAX_NOMBRE_CASILLA = 60;
const MAX_CALIFICACIONES_POR_ENVIO = 5000;
const MAX_AUTOEVALUACIONES_POR_ENVIO = 500;
const OPCIONES_TRANSACCION = { maxWait: 10000, timeout: 30000 };

class ErrorValidacion extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

const responderError = (res, error, contexto) => {
  if (error instanceof ErrorValidacion) {
    return res.status(error.status).json({ error: error.message, ...error.extra });
  }
  console.error(`Error en ${contexto}:`, error);
  return res.status(500).json({ error: 'Error interno del servidor' });
};

const esEnteroEnRango = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// Verifica acceso a la programación y, para escribir, que estemos en su trimestre activo
async function prepararAcceso(user, materiaProgramadaId, { paraEscribir }) {
  const acceso = await verificarAccesoProgramacion(user, materiaProgramadaId);
  if (acceso.error) throw new ErrorValidacion(acceso.status, acceso.error);

  const programacion = await prisma.materiaProgramada.findUnique({
    where: { id: materiaProgramadaId },
    select: { id: true, cursoId: true, gestion: true },
  });
  const activo = await periodoActivo();
  const trimestreActivo = activo && activo.gestion === programacion.gestion ? activo.trimestre : null;

  if (paraEscribir && !trimestreActivo) {
    throw new ErrorValidacion(403, 'Hoy no hay un trimestre activo para esta gestión: no se pueden registrar notas');
  }
  return { programacion, activo, trimestreActivo };
}

// Arma la respuesta de la planilla (casillas + estudiantes con sus cálculos)
async function construirPlanilla(materiaProgramadaId, trimestre, { editable, motivoNoEditable }) {
  const ctx = await cargarContexto(materiaProgramadaId, trimestre);
  return {
    materiaProgramadaId,
    gestion: ctx.programacion.gestion,
    trimestre,
    periodo: ctx.periodo,
    editable,
    ...(editable ? {} : { motivoNoEditable }),
    pesos: { ...PESOS, AUTOEVALUACION: MAX_AUTOEVALUACION },
    maxCasillas: MAX_CASILLAS,
    umbralAprobacion: ctx.umbral,
    casillas: ctx.casillas.map((c) => ({
      id: c.id,
      dimension: c.dimension,
      orden: c.orden,
      nombre: c.nombre,
      esAsistencia: c.esAsistencia,
      calificada: c.esAsistencia || ctx.casillasCalificadas.has(c.id),
    })),
    estudiantes: ctx.estudiantes.map((e) => {
      const calculo = calcularDesdeContexto(ctx, e.id);
      const asistencia = ctx.asistenciaPorEstudiante.get(e.id) || { presentes: 0, justificados: 0, ausentes: 0, total: 0 };
      return {
        id: e.id,
        nombre: e.usuario.nombre,
        valores: Object.fromEntries(ctx.valoresPorEstudiante.get(e.id) || []),
        asistencia: { ...asistencia, valor: calculo.asistencia },
        autoevaluacion: calculo.autoevaluacion,
        ser: calculo.ser,
        saber: calculo.saber,
        hacer: calculo.hacer,
        total: calculo.total,
        aprobado: calculo.aprobado,
        tieneNota: ctx.notasPorEstudiante.has(e.id),
      };
    }),
  };
}

// ── GET /api/notas/mis-materias ──────────────────────────────────────
exports.getMisMaterias = async (req, res) => {
  try {
    const isDirector = req.user.rol === 'DIRECTOR';
    let docente;
    if (!isDirector) {
      docente = await prisma.docente.findUnique({ where: { usuarioId: req.user.id } });
      if (!docente) {
        return res.status(404).json({ error: 'Perfil de docente no encontrado' });
      }
    }

    const materiasProgramadas = await prisma.materiaProgramada.findMany({
      where: isDirector ? {} : { docenteId: docente.id },
      include: {
        materia: true,
        curso: true,
        docente: { include: { usuario: { select: { nombre: true } } } },
      },
    });

    res.json(materiasProgramadas);
  } catch (error) {
    console.error('Error en getMisMaterias:', error);
    res.status(500).json({ error: 'Error al obtener materias' });
  }
};

// ── GET /api/notas/periodo-actual ────────────────────────────────────
exports.getPeriodoActual = async (req, res) => {
  try {
    const activo = await periodoActivo();
    res.json(activo || { trimestre: null, mensaje: 'Hoy no hay un trimestre activo (vacaciones o descanso)' });
  } catch (error) {
    responderError(res, error, 'getPeriodoActual');
  }
};

// ── GET /api/notas/planilla?materiaProgramadaId=&trimestre= ──────────
exports.getPlanilla = async (req, res) => {
  try {
    const { materiaProgramadaId } = req.query;
    const { trimestreActivo } = await prepararAcceso(req.user, materiaProgramadaId, { paraEscribir: false });

    let trimestre = trimestreActivo || 1;
    if (req.query.trimestre !== undefined) {
      trimestre = Number(req.query.trimestre);
      if (!esEnteroEnRango(trimestre, 1, 3)) throw new ErrorValidacion(400, 'El trimestre debe ser 1, 2 o 3');
    }

    let motivoNoEditable;
    if (req.user.rol !== 'PROFESOR') motivoNoEditable = 'El Director solo puede ver las notas';
    else if (!trimestreActivo) motivoNoEditable = 'Hoy no hay un trimestre activo';
    else if (trimestre !== trimestreActivo) motivoNoEditable = `Solo se editan notas del trimestre activo (${trimestreActivo})`;

    const planilla = await construirPlanilla(materiaProgramadaId, trimestre, {
      editable: !motivoNoEditable,
      motivoNoEditable,
    });
    res.json(planilla);
  } catch (error) {
    responderError(res, error, 'getPlanilla');
  }
};

// ── PUT /api/notas/casillas ──────────────────────────────────────────
// Body: { materiaProgramadaId, casillas: { SER: [{ id?, nombre? }], SABER: [...], HACER: [...] },
//         confirmarEliminacion?: true }
// Cada lista es la lista COMPLETA deseada de esa dimensión (las dimensiones que no
// se envían no cambian). En SER no se envía la casilla de asistencia: el sistema
// la crea y la mantiene siempre como la primera.
exports.guardarCasillas = async (req, res) => {
  try {
    const { materiaProgramadaId, casillas, confirmarEliminacion } = req.body || {};
    const { trimestreActivo: trimestre } = await prepararAcceso(req.user, materiaProgramadaId, { paraEscribir: true });

    if (!casillas || typeof casillas !== 'object' || Array.isArray(casillas)) {
      throw new ErrorValidacion(400, 'Formato inválido: se espera { casillas: { SER: [], SABER: [], HACER: [] } }');
    }
    const dimensionesEnviadas = Object.keys(casillas);
    if (!dimensionesEnviadas.length || dimensionesEnviadas.some((d) => !DIMENSIONES.includes(d))) {
      throw new ErrorValidacion(400, 'Dimensiones válidas: SER, SABER y HACER');
    }

    const existentes = await prisma.casilla.findMany({
      where: { materiaProgramadaId, trimestre },
      include: { _count: { select: { calificaciones: true } } },
      orderBy: { orden: 'asc' },
    });

    const plan = {};
    const eliminar = [];
    for (const dimension of dimensionesEnviadas) {
      const lista = casillas[dimension];
      const maximo = dimension === 'SER' ? MAX_CASILLAS - 1 : MAX_CASILLAS;
      if (!Array.isArray(lista) || lista.length > maximo) {
        throw new ErrorValidacion(400, `${dimension}: máximo ${maximo} casillas${dimension === 'SER' ? ' (más la de asistencia)' : ''}`);
      }

      const actuales = existentes.filter((c) => c.dimension === dimension && !c.esAsistencia);
      const idsActuales = new Map(actuales.map((c) => [c.id, c]));
      const vistos = new Set();
      const items = lista.map((item) => {
        if (!item || typeof item !== 'object') throw new ErrorValidacion(400, 'Cada casilla debe ser un objeto');
        if (item.nombre !== undefined && item.nombre !== null && typeof item.nombre !== 'string') {
          throw new ErrorValidacion(400, 'El nombre de la casilla debe ser texto');
        }
        const nombre = (item.nombre || '').trim().slice(0, MAX_NOMBRE_CASILLA) || null;
        if (item.id !== undefined) {
          if (!idsActuales.has(item.id) || vistos.has(item.id)) {
            throw new ErrorValidacion(400, `Casilla inválida en ${dimension}`);
          }
          vistos.add(item.id);
        }
        return { id: item.id, nombre };
      });

      for (const c of actuales) if (!vistos.has(c.id)) eliminar.push(c);
      plan[dimension] = { items, conservar: actuales.filter((c) => vistos.has(c.id)) };
    }

    const conNotas = eliminar.filter((c) => c._count.calificaciones > 0);
    if (conNotas.length && confirmarEliminacion !== true) {
      throw new ErrorValidacion(409, 'Se eliminarían casillas que ya tienen notas. Envíe confirmarEliminacion: true para continuar.', {
        casillasConNotas: conNotas.map((c) => ({
          id: c.id, dimension: c.dimension, nombre: c.nombre, notasRegistradas: c._count.calificaciones,
        })),
      });
    }

    await prisma.$transaction(async (tx) => {
      const cambios = [];
      const auditar = (accion, casilla, valorAnterior, valorNuevo) => cambios.push({
        entidad: 'CASILLA', accion, entidadId: casilla.id, materiaProgramadaId, usuarioId: req.user.id, valorAnterior, valorNuevo,
      });

      // La casilla de asistencia de SER existe siempre y es la primera
      const asistencia = existentes.find((c) => c.esAsistencia);
      if (!asistencia) {
        const creada = await tx.casilla.create({
          data: { materiaProgramadaId, trimestre, dimension: 'SER', orden: 1, nombre: 'Asistencia', esAsistencia: true },
        });
        auditar('CREAR', creada, null, { trimestre, dimension: 'SER', nombre: 'Asistencia', esAsistencia: true });
      }

      if (eliminar.length) {
        await tx.casilla.deleteMany({ where: { id: { in: eliminar.map((c) => c.id) } } });
        for (const c of eliminar) {
          auditar('ELIMINAR', c, { trimestre, dimension: c.dimension, nombre: c.nombre, notasRegistradas: c._count.calificaciones }, null);
        }
      }

      for (const dimension of Object.keys(plan)) {
        const inicio = dimension === 'SER' ? 2 : 1;
        // Compacta las que se conservan (en orden ascendente nunca hay choques)
        const nombres = new Map(plan[dimension].items.filter((i) => i.id).map((i) => [i.id, i.nombre]));
        let orden = inicio;
        for (const c of plan[dimension].conservar) {
          await tx.casilla.update({ where: { id: c.id }, data: { orden, nombre: nombres.get(c.id) } });
          if ((c.nombre ?? null) !== (nombres.get(c.id) ?? null)) {
            auditar('MODIFICAR', c, { trimestre, dimension, nombre: c.nombre }, { trimestre, dimension, nombre: nombres.get(c.id) });
          }
          orden += 1;
        }
        // Agrega las nuevas al final
        for (const item of plan[dimension].items.filter((i) => !i.id)) {
          const creada = await tx.casilla.create({ data: { materiaProgramadaId, trimestre, dimension, orden, nombre: item.nombre } });
          auditar('CREAR', creada, null, { trimestre, dimension, nombre: item.nombre });
          orden += 1;
        }
      }

      await recalcularNotas(materiaProgramadaId, trimestre, { cliente: tx });
      await registrarCambios(tx, cambios);
    }, OPCIONES_TRANSACCION);

    res.json(await construirPlanilla(materiaProgramadaId, trimestre, { editable: true }));
  } catch (error) {
    responderError(res, error, 'guardarCasillas');
  }
};

// ── PUT /api/notas/calificaciones ────────────────────────────────────
// Body: { materiaProgramadaId,
//         calificaciones:   [{ estudianteId, casillaId, valor }],  valor: entero 0–100 o null (borrar)
//         autoevaluaciones: [{ estudianteId, valor }] }             valor: entero 0–5 o null
exports.guardarCalificaciones = async (req, res) => {
  try {
    const { materiaProgramadaId } = req.body || {};
    const calificaciones = req.body?.calificaciones ?? [];
    const autoevaluaciones = req.body?.autoevaluaciones ?? [];
    const { programacion, trimestreActivo: trimestre } = await prepararAcceso(req.user, materiaProgramadaId, { paraEscribir: true });

    if (!Array.isArray(calificaciones) || !Array.isArray(autoevaluaciones)) {
      throw new ErrorValidacion(400, 'calificaciones y autoevaluaciones deben ser listas');
    }
    if (calificaciones.length > MAX_CALIFICACIONES_POR_ENVIO || autoevaluaciones.length > MAX_AUTOEVALUACIONES_POR_ENVIO) {
      throw new ErrorValidacion(400, 'Demasiados datos en un solo envío');
    }
    if (!calificaciones.length && !autoevaluaciones.length) {
      throw new ErrorValidacion(400, 'No hay cambios para guardar');
    }

    const casillas = await prisma.casilla.findMany({
      where: { materiaProgramadaId, trimestre },
      select: { id: true, esAsistencia: true },
    });
    const casillasPorId = new Map(casillas.map((c) => [c.id, c]));

    const pares = new Set();
    for (const c of calificaciones) {
      if (!c || !esIdValido(c.estudianteId) || !esIdValido(c.casillaId)) {
        throw new ErrorValidacion(400, 'Cada calificación necesita estudianteId y casillaId');
      }
      const casilla = casillasPorId.get(c.casillaId);
      if (!casilla) throw new ErrorValidacion(400, 'La casilla no pertenece a esta materia y trimestre');
      if (casilla.esAsistencia) throw new ErrorValidacion(400, 'La casilla de asistencia se calcula automáticamente y no se puede editar');
      if (c.valor !== null && !esEnteroEnRango(c.valor, 0, 100)) {
        throw new ErrorValidacion(400, 'Cada casilla debe ser un número entero entre 0 y 100');
      }
      const par = `${c.estudianteId}|${c.casillaId}`;
      if (pares.has(par)) throw new ErrorValidacion(400, 'Hay calificaciones repetidas para el mismo estudiante y casilla');
      pares.add(par);
    }

    const autoPorEstudiante = new Map();
    for (const a of autoevaluaciones) {
      if (!a || !esIdValido(a.estudianteId)) throw new ErrorValidacion(400, 'Cada autoevaluación necesita estudianteId');
      if (a.valor !== null && !esEnteroEnRango(a.valor, 0, MAX_AUTOEVALUACION)) {
        throw new ErrorValidacion(400, `La autoevaluación debe ser un número entero entre 0 y ${MAX_AUTOEVALUACION}`);
      }
      if (autoPorEstudiante.has(a.estudianteId)) throw new ErrorValidacion(400, 'Autoevaluación repetida para un estudiante');
      autoPorEstudiante.set(a.estudianteId, a.valor);
    }

    const afectados = [...new Set([...calificaciones.map((c) => c.estudianteId), ...autoPorEstudiante.keys()])];
    const pertenencia = await verificarEstudiantesEnCurso(afectados, programacion.cursoId);
    if (pertenencia.error) throw new ErrorValidacion(pertenencia.status, pertenencia.error);

    let resultados;
    await prisma.$transaction(async (tx) => {
      // Valores anteriores, para la auditoría (quién cambió qué y desde qué valor)
      const previas = await tx.calificacionCasilla.findMany({
        where: { casillaId: { in: [...new Set(calificaciones.map((c) => c.casillaId))] }, estudianteId: { in: afectados } },
        select: { casillaId: true, estudianteId: true, valor: true },
      });
      const valorPrevio = new Map(previas.map((p) => [`${p.estudianteId}|${p.casillaId}`, p.valor]));
      const autoPrevias = new Map((await tx.nota.findMany({
        where: { materiaProgramadaId, trimestre, estudianteId: { in: [...autoPorEstudiante.keys()] } },
        select: { estudianteId: true, autoevaluacion: true },
      })).map((n) => [n.estudianteId, n.autoevaluacion]));

      const cambios = [];
      for (const c of calificaciones) {
        const anterior = valorPrevio.get(`${c.estudianteId}|${c.casillaId}`) ?? null;
        if (anterior === c.valor) continue;
        cambios.push({
          entidad: 'CALIFICACION_CASILLA', accion: accionDe(anterior, c.valor), entidadId: c.casillaId,
          materiaProgramadaId, estudianteId: c.estudianteId, usuarioId: req.user.id,
          valorAnterior: anterior === null ? null : { valor: anterior, trimestre },
          valorNuevo: c.valor === null ? null : { valor: c.valor, trimestre },
        });
      }
      for (const [estudianteId, valor] of autoPorEstudiante) {
        const anterior = autoPrevias.get(estudianteId) ?? null;
        if (anterior === valor) continue;
        cambios.push({
          entidad: 'AUTOEVALUACION', accion: accionDe(anterior, valor),
          materiaProgramadaId, estudianteId, usuarioId: req.user.id,
          valorAnterior: anterior === null ? null : { valor: anterior, trimestre },
          valorNuevo: valor === null ? null : { valor, trimestre },
        });
      }

      for (const c of calificaciones) {
        if (c.valor === null) {
          await tx.calificacionCasilla.deleteMany({ where: { casillaId: c.casillaId, estudianteId: c.estudianteId } });
        } else {
          await tx.calificacionCasilla.upsert({
            where: { casillaId_estudianteId: { casillaId: c.casillaId, estudianteId: c.estudianteId } },
            update: { valor: c.valor, registradoPorId: req.user.id },
            create: { casillaId: c.casillaId, estudianteId: c.estudianteId, valor: c.valor, registradoPorId: req.user.id },
          });
        }
      }
      // Se recalcula a TODO el curso: calificar por primera vez una casilla hace
      // que cuente (con 0) también para quienes aún no tienen nota en ella.
      resultados = await recalcularNotas(materiaProgramadaId, trimestre, {
        autoevaluaciones: autoPorEstudiante,
        cliente: tx,
      });
      await registrarCambios(tx, cambios);
    }, OPCIONES_TRANSACCION);

    // Riesgo (pausado mientras IA_HABILITADA no sea "true")
    for (const estudianteId of afectados) {
      const r = resultados.get(estudianteId);
      if (!r) continue;
      await evaluarRiesgo({
        estudianteId, materiaProgramadaId, trimestre, total: r.total, porcentajeAsistencia: r.asistencia,
      }).catch((e) => console.error('Error evaluando riesgo:', e.message));
    }

    res.json(await construirPlanilla(materiaProgramadaId, trimestre, { editable: true }));
  } catch (error) {
    responderError(res, error, 'guardarCalificaciones');
  }
};
