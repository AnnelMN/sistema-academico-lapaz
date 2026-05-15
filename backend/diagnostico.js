const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== DIAGNÓSTICO PROFUNDO ===");
  
  // 1. Obtener todos los Usuarios con rol ESTUDIANTE
  const usuarios = await prisma.usuario.findMany({
    where: { rol: 'ESTUDIANTE' },
    select: { id: true, nombre: true, email: true }
  });
  console.log(`Usuarios ESTUDIANTE encontrados: ${usuarios.length}`);

  // 2. Obtener todos los Estudiantes
  const estudiantes = await prisma.estudiante.findMany({
    include: {
      curso: true
    }
  });
  console.log(`Perfiles de Estudiante encontrados: ${estudiantes.length}`);

  // 3. Cruzar datos
  console.log("\n--- Relación Usuario <-> Estudiante ---");
  for (const user of usuarios) {
    const perfil = estudiantes.find(e => e.usuarioId === user.id);
    if (perfil) {
      console.log(`[OK] Usuario: ${user.nombre} (${user.id}) -> Estudiante ID: ${perfil.id} | Curso: ${perfil.curso.nivel} ${perfil.curso.paralelo}`);
    } else {
      console.log(`[ERROR] Usuario: ${user.nombre} (${user.id}) -> NO TIENE PERFIL DE ESTUDIANTE`);
    }
  }

  // 4. Notas y Asistencias
  const notas = await prisma.nota.findMany();
  console.log(`\n--- Notas Totales: ${notas.length} ---`);
  const estudiantesIdsConNotas = [...new Set(notas.map(n => n.estudianteId))];
  console.log(`Estudiantes distintos con notas: ${estudiantesIdsConNotas.length}`);
  
  for (const id of estudiantesIdsConNotas) {
    const perfil = estudiantes.find(e => e.id === id);
    if (perfil) {
      const user = usuarios.find(u => u.id === perfil.usuarioId);
      console.log(`Notas vinculadas al Estudiante: ${id} -> Usuario: ${user ? user.nombre : 'NO ENCONTRADO'}`);
    } else {
      console.log(`[PELIGRO] Notas vinculadas a Estudiante ID huérfano: ${id}`);
    }
  }

  const asistencias = await prisma.asistencia.findMany();
  console.log(`\n--- Asistencias Totales: ${asistencias.length} ---`);
  const estudiantesIdsConAsistencias = [...new Set(asistencias.map(a => a.estudianteId))];
  console.log(`Estudiantes distintos con asistencias: ${estudiantesIdsConAsistencias.length}`);

  for (const id of estudiantesIdsConAsistencias) {
    const perfil = estudiantes.find(e => e.id === id);
    if (perfil) {
      const user = usuarios.find(u => u.id === perfil.usuarioId);
      console.log(`Asistencias vinculadas al Estudiante: ${id} -> Usuario: ${user ? user.nombre : 'NO ENCONTRADO'}`);
    } else {
      console.log(`[PELIGRO] Asistencias vinculadas a Estudiante ID huérfano: ${id}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
