const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO FIX DE ESTUDIANTES ===");

  // 1. Encontrar o crear el curso 3ro A
  let curso3A = await prisma.curso.findFirst({
    where: { nivel: 3, paralelo: 'A' }
  });

  if (!curso3A) {
    curso3A = await prisma.curso.create({
      data: {
        nivel: 3,
        paralelo: 'A'
      }
    });
    console.log(`Curso 3ro A creado: ${curso3A.id}`);
  } else {
    console.log(`Curso 3ro A encontrado: ${curso3A.id}`);
  }

  // 2. Obtener usuarios estudiantes
  const usuariosEstudiantes = await prisma.usuario.findMany({
    where: { rol: 'ESTUDIANTE' }
  });

  console.log(`\nRevisando ${usuariosEstudiantes.length} usuarios con rol ESTUDIANTE...`);

  let creados = 0;
  let actualizados = 0;

  for (const user of usuariosEstudiantes) {
    const estudianteExistente = await prisma.estudiante.findUnique({
      where: { usuarioId: user.id }
    });

    if (!estudianteExistente) {
      // Crear perfil
      await prisma.estudiante.create({
        data: {
          usuarioId: user.id,
          cursoId: curso3A.id,
          gestion: 2026,
          emailTutor: `tutor_${user.email}`
        }
      });
      creados++;
      console.log(`[CREADO] Perfil para usuario: ${user.nombre}`);
    } else if (estudianteExistente.cursoId !== curso3A.id) {
      // Actualizar curso
      await prisma.estudiante.update({
        where: { id: estudianteExistente.id },
        data: { cursoId: curso3A.id }
      });
      actualizados++;
      console.log(`[ACTUALIZADO] Curso corregido para usuario: ${user.nombre}`);
    } else {
      console.log(`[OK] Usuario ${user.nombre} ya está correcto.`);
    }
  }

  console.log(`\n--- RESUMEN DE FIX ---`);
  console.log(`Perfiles creados: ${creados}`);
  console.log(`Perfiles actualizados (movidos a 3ro A): ${actualizados}`);

  // 3. Verificar Notas y Asistencias
  console.log("\n--- VERIFICACIÓN DE INTEGRIDAD ---");
  const notas = await prisma.nota.findMany({ include: { estudiante: true }});
  const notasHuerfanas = notas.filter(n => !n.estudiante);
  console.log(`Notas totales: ${notas.length} | Notas huérfanas: ${notasHuerfanas.length}`);

  const asistencias = await prisma.asistencia.findMany({ include: { estudiante: true }});
  const asistenciasHuerfanas = asistencias.filter(a => !a.estudiante);
  console.log(`Asistencias totales: ${asistencias.length} | Asistencias huérfanas: ${asistenciasHuerfanas.length}`);

  if (notasHuerfanas.length === 0 && asistenciasHuerfanas.length === 0) {
    console.log("[EXITO] Todos los registros de Notas y Asistencias están vinculados correctamente a un Estudiante válido.");
  } else {
    console.log("[ADVERTENCIA] Se encontraron registros huérfanos.");
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
