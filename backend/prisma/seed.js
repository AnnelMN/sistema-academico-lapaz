require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) => (
  typeof password === 'string'
  && password.length >= 10
  && /[A-Za-z]/.test(password)
  && /\d/.test(password)
);

const getDemoUser = (prefix) => {
  const email = String(process.env[`DEMO_${prefix}_EMAIL`] || '').trim().toLowerCase();
  const password = process.env[`DEMO_${prefix}_PASSWORD`];
  const nombre = String(process.env[`DEMO_${prefix}_NAME`] || '').trim();

  if (!email || !password || !nombre) {
    throw new Error(`Faltan DEMO_${prefix}_EMAIL, DEMO_${prefix}_PASSWORD o DEMO_${prefix}_NAME en backend/.env`);
  }
  if (!isValidEmail(email)) {
    throw new Error(`DEMO_${prefix}_EMAIL no es un correo válido`);
  }
  if (!isStrongPassword(password)) {
    throw new Error(`DEMO_${prefix}_PASSWORD debe tener al menos 10 caracteres, una letra y un número`);
  }

  return { email, password, nombre };
};

const seedDemoData = async () => {
  const administrativoDemo = getDemoUser('ADMINISTRATIVO');
  const profesorDemo = getDemoUser('PROFESOR');
  const estudianteDemo = getDemoUser('ESTUDIANTE');
  const tutorEmail = String(process.env.DEMO_TUTOR_EMAIL || '').trim().toLowerCase();

  if (!isValidEmail(tutorEmail)) {
    throw new Error('DEMO_TUTOR_EMAIL debe ser un correo válido');
  }

  console.log('Creating demo users...');
  const [adminPassword, profesorPassword, estudiantePassword] = await Promise.all([
    bcrypt.hash(administrativoDemo.password, 10),
    bcrypt.hash(profesorDemo.password, 10),
    bcrypt.hash(estudianteDemo.password, 10),
  ]);

  const administrativo = await prisma.usuario.upsert({
    where: { email: administrativoDemo.email },
    update: {},
    create: {
      email: administrativoDemo.email,
      nombre: administrativoDemo.nombre,
      password: adminPassword,
      rol: 'ADMINISTRATIVO',
      activo: true,
    },
  });

  const profesor = await prisma.usuario.upsert({
    where: { email: profesorDemo.email },
    update: {},
    create: {
      email: profesorDemo.email,
      nombre: profesorDemo.nombre,
      password: profesorPassword,
      rol: 'PROFESOR',
      activo: true,
    },
  });

  const estudiante = await prisma.usuario.upsert({
    where: { email: estudianteDemo.email },
    update: {},
    create: {
      email: estudianteDemo.email,
      nombre: estudianteDemo.nombre,
      password: estudiantePassword,
      rol: 'ESTUDIANTE',
      activo: true,
    },
  });

  const docente = await prisma.docente.upsert({
    where: { usuarioId: profesor.id },
    update: {},
    create: { usuarioId: profesor.id, especialidad: 'Matemáticas' },
  });

  const curso = await prisma.curso.findFirst({ where: { nivel: 3, paralelo: 'A' } });
  const materia = await prisma.materia.findFirst({ where: { nombre: 'Matemáticas' } });
  if (!curso || !materia) {
    throw new Error('No se encontraron el curso 3ro A o la materia Matemáticas');
  }

  const estudiantePerfil = await prisma.estudiante.upsert({
    where: { usuarioId: estudiante.id },
    update: {},
    create: {
      usuarioId: estudiante.id,
      cursoId: curso.id,
      gestion: 2026,
      emailTutor: tutorEmail,
    },
  });

  let programacion = await prisma.materiaProgramada.findFirst({
    where: { docenteId: docente.id, materiaId: materia.id, cursoId: curso.id, gestion: 2026 },
  });

  if (!programacion) {
    programacion = await prisma.materiaProgramada.create({
      data: {
        docenteId: docente.id,
        materiaId: materia.id,
        cursoId: curso.id,
        horario: 'Lunes 07:30',
        gestion: 2026,
      },
    });
  }

  await prisma.nota.upsert({
    where: {
      estudianteId_materiaProgramadaId_trimestre: {
        estudianteId: estudiantePerfil.id,
        materiaProgramadaId: programacion.id,
        trimestre: 1,
      },
    },
    update: {},
    create: {
      estudianteId: estudiantePerfil.id,
      materiaProgramadaId: programacion.id,
      trimestre: 1,
      ser: 12,
      saber: 27,
      hacer: 30,
      total: 69,
      aprobado: true,
    },
  });

  const asistencias = [
    ['2026-03-02T12:00:00.000Z', 'PRESENTE'],
    ['2026-03-04T12:00:00.000Z', 'PRESENTE'],
    ['2026-03-09T12:00:00.000Z', 'PRESENTE'],
    ['2026-03-11T12:00:00.000Z', 'AUSENTE'],
    ['2026-03-16T12:00:00.000Z', 'PRESENTE'],
  ];

  for (const [fecha, estado] of asistencias) {
    await prisma.asistencia.upsert({
      where: {
        estudianteId_materiaProgramadaId_fecha: {
          estudianteId: estudiantePerfil.id,
          materiaProgramadaId: programacion.id,
          fecha: new Date(fecha),
        },
      },
      update: {},
      create: {
        estudianteId: estudiantePerfil.id,
        materiaProgramadaId: programacion.id,
        fecha: new Date(fecha),
        estado,
      },
    });
  }

  const prediccionExistente = await prisma.prediccionRiesgo.findFirst({
    where: { estudianteId: estudiantePerfil.id, trimestre: 1 },
  });

  if (!prediccionExistente) {
    await prisma.prediccionRiesgo.create({
      data: {
        estudianteId: estudiantePerfil.id,
        nivelRiesgo: 'SIN_RIESGO',
        probabilidad: 0.85,
        promedioNotas: 69,
        porcentajeAsistencia: 80,
        trimestre: 1,
      },
    });
  }

  console.log(`Demo Administrativo ready: ${administrativo.email}`);
  console.log(`Demo Profesor ready: ${profesor.email}`);
  console.log(`Demo Estudiante ready: ${estudiante.email}`);
};

const getDirectorFromEnv = () => {
  const email = String(process.env.INITIAL_DIRECTOR_EMAIL || '').trim().toLowerCase();
  const password = process.env.INITIAL_DIRECTOR_PASSWORD;
  const nombre = String(process.env.INITIAL_DIRECTOR_NAME || '').trim();

  const configuredCount = [email, password, nombre].filter(Boolean).length;
  if (configuredCount === 0) return null;

  if (!email || !password || !nombre) {
    throw new Error(
      'INITIAL_DIRECTOR_EMAIL, INITIAL_DIRECTOR_PASSWORD y INITIAL_DIRECTOR_NAME deben configurarse juntos'
    );
  }

  if (!isValidEmail(email)) {
    throw new Error('INITIAL_DIRECTOR_EMAIL no es un correo válido');
  }

  if (!isStrongPassword(password)) {
    throw new Error('INITIAL_DIRECTOR_PASSWORD debe tener al menos 10 caracteres, una letra y un número');
  }

  return { email, password, nombre };
};

async function main() {
  console.log('Starting seeding...');

  const initialDirector = getDirectorFromEnv();
  if (!initialDirector) {
    const directorCount = await prisma.usuario.count({ where: { rol: 'DIRECTOR', activo: true } });
    if (directorCount === 0) {
      throw new Error('No existe un Director activo. Configura INITIAL_DIRECTOR_EMAIL, INITIAL_DIRECTOR_PASSWORD e INITIAL_DIRECTOR_NAME en backend/.env');
    }
    console.log('INITIAL_DIRECTOR_* no configurado; se mantiene el Director existente.');
  }

  await prisma.configuracion.upsert({
    where: { id: 'config-1' },
    update: {},
    create: {
      id: 'config-1',
      limiteFaltas: 25,
      umbralAprobacion: 51,
      trimestreActivo: 1,
      gestionActual: 2026,
    },
  });

  console.log('Default configuration ready.');

  const niveles = [1, 2, 3, 4, 5, 6];
  const paralelos = ['A', 'B', 'C', 'D', 'E'];

  console.log('Seeding Cursos...');
  for (const nivel of niveles) {
    for (const paralelo of paralelos) {
      await prisma.curso.upsert({
        where: { nivel_paralelo: { nivel, paralelo } },
        update: {},
        create: { nivel, paralelo },
      });
    }
  }

  console.log('Seeding Materias...');
  const materiasData = [
    { nombre: 'Matemáticas', cargaHoraria: 4, nivel: 3 },
    { nombre: 'Física', cargaHoraria: 4, nivel: 5 },
    { nombre: 'Química', cargaHoraria: 3, nivel: 4 },
    { nombre: 'Lenguaje', cargaHoraria: 4, nivel: 1 },
    { nombre: 'Biología', cargaHoraria: 3, nivel: 2 },
  ];

  for (const materia of materiasData) {
    const existing = await prisma.materia.findFirst({ where: { nombre: materia.nombre } });
    if (!existing) {
      await prisma.materia.create({ data: materia });
    }
  }

  if (initialDirector) {
    console.log('Creating initial Director...');
    const hashedPassword = await bcrypt.hash(initialDirector.password, 10);
    const director = await prisma.usuario.upsert({
      where: { email: initialDirector.email },
      update: {},
      create: {
        email: initialDirector.email,
        nombre: initialDirector.nombre,
        password: hashedPassword,
        rol: 'DIRECTOR',
        activo: true,
      },
      select: { email: true, nombre: true, rol: true, activo: true },
    });

    console.log(`Initial Director ready: ${director.email}`);
  }

  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedDemoData();
  } else {
    console.log('SEED_DEMO_DATA is not enabled; demo users and academic data were not created.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
