const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
  const email = 'profesor@lapaz.edu.bo';
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  
  if (!usuario) {
    console.log('Usuario no encontrado');
    return;
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('TOKEN_DOCENTE:', token);
  
  // Also, let's check if the docente profile exists
  const docente = await prisma.docente.findUnique({
    where: { usuarioId: usuario.id }
  });
  console.log('DOCENTE_PROFILE:', docente);
}

test().finally(() => prisma.$disconnect());
