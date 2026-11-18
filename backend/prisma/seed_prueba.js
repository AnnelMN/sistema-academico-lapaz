// Datos de prueba: 5 estudiantes en 3ro A con notas y asistencias de ejemplo
// (escala real SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5) en los
// trimestres 1 y 2, para cada materia de 3ro A del profesor demo.
//
// Requiere en backend/.env: SEED_DEMO_DATA=true, DEMO_PROFESOR_EMAIL y
// DEMO_ESTUDIANTE_PASSWORD (y haber ejecutado antes el seed principal).
// Se niega a ejecutarse con NODE_ENV=production.
//   node prisma/seed_prueba.js           → aplica los cambios
//   node prisma/seed_prueba.js --ensayo  → prueba todo y lo deshace al final
//
// Los nombres son ficticios y los correos de tutor usan example.com (dominio
// reservado para ejemplos): nunca se envía correo a una persona real.
// Las cuentas que ya existen NO cambian de contraseña ni se reactivan.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { asegurarPeriodos, crearNotasDeEjemplo, ejecutarSeed } = require('./seedHelpers');

const prisma = new PrismaClient();

const esContrasenaRobusta = (p) => typeof p === 'string' && p.length >= 10 && /[A-Za-z]/.test(p) && /\d/.test(p);

const ESTUDIANTES = [
  { nombre: 'Juan Mamani',   email: 'juan.mamani@estudiante.edu.bo',   emailTutor: 'tutor.mamani@example.com',  perfil: 'bajo' },
  { nombre: 'María Quispe',  email: 'maria.quispe@estudiante.edu.bo',  emailTutor: 'tutor.quispe@example.com',  perfil: 'alto' },
  { nombre: 'Carlos Flores', email: 'carlos.flores@estudiante.edu.bo', emailTutor: 'tutor.flores@example.com',  perfil: 'medio' },
  { nombre: 'Ana Condori',   email: 'ana.condori@estudiante.edu.bo',   emailTutor: 'tutor.condori@example.com', perfil: 'alto' },
  { nombre: 'Luis Vargas',   email: 'luis.vargas@estudiante.edu.bo',   emailTutor: 'tutor.vargas@example.com',  perfil: 'bajo' },
];

async function main(db) {
  console.log('\n==============================');
  console.log('  SEED DE DATOS DE PRUEBA');
  console.log('==============================\n');

  // Candado: los datos de prueba nunca deben cargarse en producción
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed_prueba.js no se ejecuta con NODE_ENV=production');
  }
  if (process.env.SEED_DEMO_DATA !== 'true') {
    throw new Error('seed_prueba.js requiere SEED_DEMO_DATA=true en backend/.env (solo en desarrollo)');
  }

  const emailProfesor = String(process.env.DEMO_PROFESOR_EMAIL || '').trim().toLowerCase();
  const contrasenaEstudiantes = process.env.DEMO_ESTUDIANTE_PASSWORD;
  if (!emailProfesor) throw new Error('Falta DEMO_PROFESOR_EMAIL en backend/.env');
  if (!esContrasenaRobusta(contrasenaEstudiantes)) {
    throw new Error('DEMO_ESTUDIANTE_PASSWORD debe existir en backend/.env y tener al menos 10 caracteres, una letra y un número');
  }

  await asegurarPeriodos(db);

  // 1. Curso 3ro A
  const curso3A = await db.curso.findFirst({ where: { nivel: 3, paralelo: 'A' } });
  if (!curso3A) throw new Error('El curso 3ro A no existe. Ejecuta primero el seed principal.');
  console.log('1. ✅ Curso 3ro A encontrado');

  // 2. Profesor demo y su perfil docente
  const usuarioProfesor = await db.usuario.findUnique({ where: { email: emailProfesor } });
  const docente = usuarioProfesor && await db.docente.findUnique({ where: { usuarioId: usuarioProfesor.id } });
  if (!docente) throw new Error('No se encontró el profesor demo (DEMO_PROFESOR_EMAIL). Ejecuta primero el seed principal.');
  console.log(`2. ✅ Profesor demo: ${usuarioProfesor.nombre}`);

  // 3. Materias del docente en 3ro A (gestión 2026)
  const asignaciones = await db.materiaProgramada.findMany({
    where: { docenteId: docente.id, cursoId: curso3A.id, gestion: 2026 },
    include: { materia: true },
  });
  if (!asignaciones.length) throw new Error('El profesor demo no tiene materias en 3ro A (2026). Ejecuta primero el seed principal.');
  console.log(`3. ✅ Materias en 3ro A: ${asignaciones.map((a) => a.materia.nombre).join(', ')}`);

  // 4. Estudiantes (las cuentas existentes no cambian de contraseña ni de estado)
  console.log('\n4. Estudiantes...');
  const hash = await bcrypt.hash(contrasenaEstudiantes, 12);
  const estudiantes = [];
  for (const e of ESTUDIANTES) {
    const usuario = await db.usuario.upsert({
      where: { email: e.email },
      update: { nombre: e.nombre },
      create: { nombre: e.nombre, email: e.email, password: hash, rol: 'ESTUDIANTE', activo: true },
    });
    const perfil = await db.estudiante.upsert({
      where: { usuarioId: usuario.id },
      update: { cursoId: curso3A.id, gestion: 2026, emailTutor: e.emailTutor },
      create: { usuarioId: usuario.id, cursoId: curso3A.id, gestion: 2026, emailTutor: e.emailTutor },
    });
    estudiantes.push({ id: perfil.id, perfil: e.perfil, nombre: e.nombre, activo: usuario.activo });
    console.log(`   ✅ ${e.nombre} (${e.perfil}${usuario.activo ? '' : ', cuenta INACTIVA'})`);
  }

  // 5. Notas y asistencias de ejemplo en los trimestres 1 y 2
  console.log('\n5. Notas de ejemplo...');
  for (const a of asignaciones) {
    for (const trimestre of [1, 2]) {
      const r = await crearNotasDeEjemplo(db, {
        materiaProgramadaId: a.id,
        trimestre,
        estudiantes,
        registradoPorId: usuarioProfesor.id,
      });
      if (!r.creado) {
        console.log(`   ⚠️  ${a.materia.nombre} T${trimestre}: ya tenía casillas, no se modificó`);
        continue;
      }
      const resumen = estudiantes.map((e) => {
        const n = r.resultados.get(e.id);
        return `${e.nombre.split(' ')[0]} ${n ? `${n.total}${n.aprobado ? '' : ' ✗'}` : '—'}`;
      });
      console.log(`   ✅ ${a.materia.nombre} T${trimestre}: ${resumen.join(' · ')}`);
    }
  }

  console.log('\n==============================');
  console.log('  ✅ SEED DE PRUEBA COMPLETADO');
  console.log('==============================\n');
}

ejecutarSeed(prisma, main);
