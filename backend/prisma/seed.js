const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Configuración inicial de la institución
  const config = await prisma.configuracion.upsert({
    where: { id: 'config-1' }, // Ensure we don't create multiple configs if run multiple times, though the schema doesn't have a strict unique constraint on config, let's just create it if it doesn't exist. Actually, let's just use create or ignore.
    update: {},
    create: {
      limiteFaltas: 25,
      umbralAprobacion: 51,
      trimestreActivo: 1,
      gestionActual: 2026,
    },
  }).catch(() => console.log('Config ya existe, continuando...'));
  
  console.log('Created default configuration.');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Director2026!', salt);
  const passwordProfesor = await bcrypt.hash('Profesor2026!', salt);
  const passwordAdmin = await bcrypt.hash('Admin2026!', salt);
  const passwordEstudiante = await bcrypt.hash('Estudiante2026!', salt);

  // Usuario Director
  const director = await prisma.usuario.upsert({
    where: { email: 'director@lapaz.edu.bo' },
    update: {},
    create: {
      email: 'director@lapaz.edu.bo',
      nombre: 'Director General',
      password: hashedPassword,
      rol: 'DIRECTOR',
      activo: true,
    },
  });
  console.log(`Created Director: ${director.email}`);

  // Usuario Profesor
  const profesor = await prisma.usuario.upsert({
    where: { email: 'profesor@lapaz.edu.bo' },
    update: {},
    create: {
      email: 'profesor@lapaz.edu.bo',
      nombre: 'Prof. María García',
      password: passwordProfesor,
      rol: 'PROFESOR',
      activo: true,
    },
  });
  console.log(`Created Profesor: ${profesor.email}`);

  // Usuario Administrativo
  const administrativo = await prisma.usuario.upsert({
    where: { email: 'admin@lapaz.edu.bo' },
    update: {},
    create: {
      email: 'admin@lapaz.edu.bo',
      nombre: 'Lic. Rosa Huanca',
      password: passwordAdmin,
      rol: 'ADMINISTRATIVO',
      activo: true,
    },
  });
  console.log(`Created Administrativo: ${administrativo.email}`);

  // Usuario Estudiante
  const estudiante = await prisma.usuario.upsert({
    where: { email: 'estudiante@lapaz.edu.bo' },
    update: {},
    create: {
      email: 'estudiante@lapaz.edu.bo',
      nombre: 'Carlos A. Mamani Flores',
      password: passwordEstudiante,
      rol: 'ESTUDIANTE',
      activo: true,
    },
  });
  console.log(`Created Estudiante: ${estudiante.email}`);

  // Cursos (1ro a 6to, Paralelos A-E)
  console.log('Seeding Cursos...');
  const niveles = [1, 2, 3, 4, 5, 6];
  const paralelos = ['A', 'B', 'C', 'D', 'E'];
  
  for (const nivel of niveles) {
    for (const paralelo of paralelos) {
      await prisma.curso.upsert({
        where: { nivel_paralelo: { nivel, paralelo } },
        update: {},
        create: { nivel, paralelo }
      });
    }
  }

  // Materias
  console.log('Seeding Materias...');
  const materiasData = [
    { nombre: 'Matemáticas', cargaHoraria: 4, nivel: 3 },
    { nombre: 'Física', cargaHoraria: 4, nivel: 5 },
    { nombre: 'Química', cargaHoraria: 3, nivel: 4 },
    { nombre: 'Lenguaje', cargaHoraria: 4, nivel: 1 },
    { nombre: 'Biología', cargaHoraria: 3, nivel: 2 },
  ];

  for (const m of materiasData) {
    await prisma.materia.upsert({
      where: { id: m.nombre.toLowerCase().replace(/á/g, 'a').replace(/í/g, 'i') }, // Using a slug as temporary ID if needed or just use name
      update: {},
      create: {
        id: m.nombre.toLowerCase().replace(/á/g, 'a').replace(/í/g, 'i'),
        ...m
      }
    }).catch(async () => {
      // If id is not compatible, let Prisma generate one
      await prisma.materia.create({ data: m });
    });
  }

  // Perfil de Docente
  console.log('Creating Docente profile...');
  const docenteProfile = await prisma.docente.upsert({
    where: { usuarioId: profesor.id },
    update: {},
    create: {
      usuarioId: profesor.id,
      especialidad: 'Ciencias Exactas'
    }
  });

  // Asignaciones (MateriaProgramada)
  console.log('Creating assignments...');
  const curso3A = await prisma.curso.findFirst({ where: { nivel: 3, paralelo: 'A' } });
  const curso5A = await prisma.curso.findFirst({ where: { nivel: 5, paralelo: 'A' } });
  const matMatematicas = await prisma.materia.findFirst({ where: { nombre: 'Matemáticas' } });
  const matFisica = await prisma.materia.findFirst({ where: { nombre: 'Física' } });

  if (curso3A && matMatematicas) {
    await prisma.materiaProgramada.create({
      data: {
        docenteId: docenteProfile.id,
        materiaId: matMatematicas.id,
        cursoId: curso3A.id,
        horario: 'Lunes-07:30',
        gestion: 2026
      }
    });
  }

  if (curso5A && matFisica) {
    await prisma.materiaProgramada.create({
      data: {
        docenteId: docenteProfile.id,
        materiaId: matFisica.id,
        cursoId: curso5A.id,
        horario: 'Martes-09:30',
        gestion: 2026
      }
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
