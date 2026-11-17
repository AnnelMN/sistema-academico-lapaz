const prisma = require('../lib/prisma');
const { iaHabilitada, PREDICCION_NO_DISPONIBLE } = require('../services/iaService');

// MATERIAS
const getMaterias = async (req, res) => {
  try {
    const materias = await prisma.materia.findMany({
      orderBy: { nombre: 'asc' }
    });
    // Formato sugerido por el frontend: agregar un 'estado' ficticio si no existe en BD, o activo por defecto
    const materiasMapped = materias.map(m => ({
      ...m,
      estado: 'Activa' // Según el mockup, la mayoría están Activas
    }));
    res.json(materiasMapped);
  } catch (error) {
    console.error('Error fetching materias:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createMateria = async (req, res) => {
  try {
    const { nombre, nivel, cargaHoraria } = req.body;
    if (!nombre || !nivel || !cargaHoraria) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const nuevaMateria = await prisma.materia.create({
      data: {
        nombre,
        nivel: parseInt(nivel),
        cargaHoraria: parseInt(cargaHoraria)
      }
    });
    res.status(201).json(nuevaMateria);
  } catch (error) {
    console.error('Error creating materia:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// CURSOS
const getCursos = async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: [
        { nivel: 'asc' },
        { paralelo: 'asc' }
      ]
    });
    res.json(cursos);
  } catch (error) {
    console.error('Error fetching cursos:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCurso = async (req, res) => {
  try {
    const { nivel, paralelo } = req.body;

    if (!nivel || !paralelo) {
      return res.status(400).json({ error: 'Nivel y paralelo son requeridos' });
    }

    const existing = await prisma.curso.findFirst({
      where: { nivel: parseInt(nivel), paralelo }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe ese curso' });
    }

    const curso = await prisma.curso.create({
      data: {
        nivel: parseInt(nivel),
        paralelo
      }
    });

    res.status(201).json(curso);
  } catch (error) {
    console.error('Error creating curso:', error);
    res.status(500).json({ error: 'Server error creating curso' });
  }
};

// DOCENTES
const getDocentes = async (req, res) => {
  try {
    // Obtenemos los docentes junto con sus datos de usuario
    const docentes = await prisma.docente.findMany({
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
            activo: true
          }
        }
      }
    });
    // Filtramos solo los activos
    const docentesActivos = docentes.filter(d => d.usuario.activo);
    res.json(docentesActivos);
  } catch (error) {
    console.error('Error fetching docentes:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DASHBOARD DIRECTOR
const getDirectorDashboard = async (req, res) => {
  try {
    const config = await prisma.configuracion.findFirst();
    const gestion = config?.gestionActual || new Date().getFullYear();
    const trimestre = config?.trimestreActivo || 1;
    const umbral = config?.umbralAprobacion || 51;
    const prediccionesDisponibles = iaHabilitada();

    const [totalEstudiantes, cursos, notas, asistencias, predicciones] = await Promise.all([
      prisma.estudiante.count({ where: { usuario: { activo: true } } }),
      prisma.curso.findMany({
        orderBy: [{ nivel: 'asc' }, { paralelo: 'asc' }],
      }),
      prisma.nota.findMany({
        where: { materiaProgramada: { gestion } },
        select: {
          estudianteId: true,
          total: true,
          estudiante: {
            select: {
              cursoId: true,
              curso: { select: { nivel: true, paralelo: true } },
            },
          },
        },
      }),
      prisma.asistencia.findMany({ select: { estado: true } }),
      // Predicciones pausadas: no se consultan ni se envían datos de riesgo
      !prediccionesDisponibles ? Promise.resolve([]) : prisma.prediccionRiesgo.findMany({
        orderBy: { generadoEn: 'desc' },
        select: {
          estudianteId: true,
          nivelRiesgo: true,
          probabilidad: true,
          promedioNotas: true,
          porcentajeAsistencia: true,
          estudiante: {
            select: {
              usuario: { select: { nombre: true, activo: true } },
              curso: { select: { nivel: true, paralelo: true } },
            },
          },
        },
      }),
    ]);

    const acumuladoPorEstudiante = new Map();
    const acumuladoPorCurso = new Map();

    for (const nota of notas) {
      const actual = acumuladoPorEstudiante.get(nota.estudianteId) || { suma: 0, cantidad: 0 };
      actual.suma += nota.total;
      actual.cantidad += 1;
      acumuladoPorEstudiante.set(nota.estudianteId, actual);

      const studentNote = { suma: 0, cantidad: 0 };
      const cursoActual = acumuladoPorCurso.get(nota.estudiante.cursoId) || new Map();
      const cursoEstudiante = cursoActual.get(nota.estudianteId) || studentNote;
      cursoEstudiante.suma += nota.total;
      cursoEstudiante.cantidad += 1;
      cursoActual.set(nota.estudianteId, cursoEstudiante);
      acumuladoPorCurso.set(nota.estudiante.cursoId, cursoActual);
    }

    const aprobados = [...acumuladoPorEstudiante.values()].filter(
      ({ suma, cantidad }) => suma / cantidad >= umbral
    ).length;
    const estudiantesConNotas = acumuladoPorEstudiante.size;
    const tasaAprobacion = estudiantesConNotas
      ? Math.round((aprobados / estudiantesConNotas) * 100)
      : 0;

    const asistenciasValidas = asistencias.filter(
      (asistencia) => asistencia.estado === 'PRESENTE' || asistencia.estado === 'JUSTIFICADO'
    ).length;
    const asistenciaMedia = asistencias.length
      ? Math.round((asistenciasValidas / asistencias.length) * 100)
      : 0;

    const latestPredictions = new Map();
    for (const prediccion of predicciones) {
      if (prediccion.estudiante.usuario.activo && !latestPredictions.has(prediccion.estudianteId)) {
        latestPredictions.set(prediccion.estudianteId, prediccion);
      }
    }

    const latest = [...latestPredictions.values()];
    const riesgoAlto = prediccionesDisponibles
      ? latest.filter((prediccion) => prediccion.nivelRiesgo === 'RIESGO_ALTO').length
      : null;

    const estudiantesRiesgo = latest
      .filter((prediccion) => prediccion.nivelRiesgo !== 'SIN_RIESGO')
      .slice(0, 6)
      .map((prediccion) => {
        const curso = prediccion.estudiante.curso;
        const nivel = prediccion.nivelRiesgo;
        return {
          id: prediccion.estudianteId,
          name: prediccion.estudiante.usuario.nombre,
          info: `${curso.nivel}° ${curso.paralelo} · Promedio ${prediccion.promedioNotas.toFixed(1)} · Asistencia ${Math.round(prediccion.porcentajeAsistencia)}%`,
          risk: nivel === 'RIESGO_ALTO' ? 'Alto' : 'Medio',
          nivelRiesgo: nivel,
        };
      });

    const cursosDashboard = cursos
      .filter((curso) => acumuladoPorCurso.has(curso.id))
      .map((curso) => {
      const estudiantesCurso = acumuladoPorCurso.get(curso.id);
      const estudiantes = estudiantesCurso ? [...estudiantesCurso.values()] : [];
      const aprobadosCurso = estudiantes.filter(
        ({ suma, cantidad }) => suma / cantidad >= umbral
      ).length;
      const val = estudiantes.length
        ? Math.round((aprobadosCurso / estudiantes.length) * 100)
        : 0;
      return { id: curso.id, label: `${curso.nivel}° ${curso.paralelo}`, val };
    });

    res.json({
      gestion,
      trimestreActivo: trimestre,
      totalEstudiantes,
      tasaAprobacion,
      asistenciaMedia,
      riesgoAlto,
      cursos: cursosDashboard,
      estudiantesRiesgo,
      prediccionesDisponibles,
      ...(prediccionesDisponibles ? {} : { mensajePredicciones: PREDICCION_NO_DISPONIBLE.mensaje }),
    });
  } catch (error) {
    console.error('Error fetching director dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getMaterias,
  createMateria,
  getCursos,
  createCurso,
  getDocentes,
  getDirectorDashboard,
};
