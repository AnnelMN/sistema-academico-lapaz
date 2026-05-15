const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.usuario.findFirst({
    where: { rol: 'ESTUDIANTE' },
    include: { estudiante: true }
  });
  console.log('Estudiante Email:', u?.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
