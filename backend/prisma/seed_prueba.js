const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n==============================');
  console.log('  SEED DE DATOS DE PRUEBA');
  console.log('==============================\n');

  const salt = await bcrypt.genSalt(10);

  // ─────────────────────────────────────────
  // 1. VERIFICAR / CREAR CURSO 3ro A
  // ─────────────────────────────────────────
  console.log('1. Verificando curso 3ro A...');
  const curso3A = await prisma.curso.findFirst({ where: { nivel: 3, paralelo: 'A' } });
  if (!curso3A) {
    console.error('   ❌ Curso 3ro A no existe. Ejecuta el seed principal primero.');
    return;
  }
  console.log(`   ✅ Curso 3ro A encontrado: ${curso3A.id}`);

  // ─────────────────────────────────────────
  // 2. VERIFICAR PROFESOR Y SU PERFIL DOCENTE
  // ─────────────────────────────────────────
  console.log('\n2. Verificando profesor María García...');
  const usuarioProfesor = await prisma.usuario.findUnique({
    where: { email: 'profesor@lapaz.edu.bo' }
  });

  if (!usuarioProfesor) {
    console.error('   ❌ Profesor no encontrado. Ejecuta el seed principal primero.');
    return;
  }
  console.log(`   ✅ Usuario profesor encontrado: ${usuarioProfesor.nombre}`);

  const docenteProfile = await prisma.docente.findUnique({
    where: { usuarioId: usuarioProfesor.id }
  });

  if (!docenteProfile) {
    console.error('   ❌ Perfil de docente no existe. Ejecuta el seed principal primero.');
    return;
  }
  console.log(`   ✅ Perfil de docente encontrado: ${docenteProfile.id}`);

  // ─────────────────────────────────────────
  // 3. VERIFICAR MATERIAS ASIGNADAS AL DOCENTE
  // ─────────────────────────────────────────
  console.log('\n3. Verificando asignaciones del docente...');
  const asignaciones = await prisma.materiaProgramada.findMany({
    where: { docenteId: docenteProfile.id },
    include: { materia: true, curso: true }
  });

  if (asignaciones.length === 0) {
    console.error('   ❌ El docente no tiene materias asignadas. Ejecuta el seed principal primero.');
    return;
  }

  for (const a of asignaciones) {
    console.log(`   ✅ Asignación: ${a.materia.nombre} → ${a.curso.nivel}ro ${a.curso.paralelo} (gestion ${a.gestion})`);
  }

  // ─────────────────────────────────────────
  // 4. CREAR USUARIOS ESTUDIANTES
  // ─────────────────────────────────────────
  console.log('\n4. Creando estudiantes...');

  const estudiantesData = [
    { nombre: 'Juan Mamani',   email: 'juan.mamani@estudiante.edu.bo',   emailTutor: 'tutor.mamani@gmail.com' },
    { nombre: 'María Quispe',  email: 'maria.quispe@estudiante.edu.bo',  emailTutor: 'tutor.quispe@gmail.com' },
    { nombre: 'Carlos Flores', email: 'carlos.flores@estudiante.edu.bo', emailTutor: 'tutor.flores@gmail.com' },
    { nombre: 'Ana Condori',   email: 'ana.condori@estudiante.edu.bo',   emailTutor: 'tutor.condori@gmail.com' },
    { nombre: 'Luis Vargas',   email: 'luis.vargas@estudiante.edu.bo',   emailTutor: 'tutor.vargas@gmail.com' },
  ];

  const passwordEstudiante = await bcrypt.hash('Estudiante2026!', salt);

  for (const e of estudiantesData) {
    // Crear o recuperar usuario
    const usuario = await prisma.usuario.upsert({
      where: { email: e.email },
      update: { nombre: e.nombre },
      create: {
        nombre: e.nombre,
        email: e.email,
        password: passwordEstudiante,
        rol: 'ESTUDIANTE',
        activo: true
      }
    });

    // Crear o recuperar perfil estudiante
    const estudianteExistente = await prisma.estudiante.findUnique({
      where: { usuarioId: usuario.id }
    });

    if (!estudianteExistente) {
      await prisma.estudiante.create({
        data: {
          usuarioId: usuario.id,
          cursoId: curso3A.id,
          gestion: 2026,
          emailTutor: e.emailTutor
        }
      });
      console.log(`   ✅ Creado: ${e.nombre} (${e.email})`);
    } else {
      console.log(`   ⚠️  Ya existía: ${e.nombre} — actualizado cursoId y emailTutor`);
      await prisma.estudiante.update({
        where: { usuarioId: usuario.id },
        data: {
          cursoId: curso3A.id,
          gestion: 2026,
          emailTutor: e.emailTutor
        }
      });
    }
  }

  // ─────────────────────────────────────────
  // 5. VERIFICACIÓN FINAL
  // ─────────────────────────────────────────
  console.log('\n5. Verificación final en Supabase...');

  const totalEstudiantes = await prisma.estudiante.findMany({
    where: { cursoId: curso3A.id },
    include: { usuario: { select: { nombre: true, email: true } } }
  });

  console.log(`\n   Estudiantes en 3ro A (${totalEstudiantes.length} total):`);
  for (const est of totalEstudiantes) {
    console.log(`   • ${est.usuario.nombre} | ${est.usuario.email} | tutor: ${est.emailTutor}`);
  }

  const totalAsignaciones = await prisma.materiaProgramada.count({
    where: { docenteId: docenteProfile.id }
  });

  console.log(`\n   Materias asignadas a Prof. García: ${totalAsignaciones}`);

  console.log('\n==============================');
  console.log('  ✅ SEED COMPLETADO');
  console.log('==============================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR EN SEED:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
