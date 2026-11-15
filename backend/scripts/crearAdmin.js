/**
 * Script temporal para crear/actualizar un DIRECTOR real para pruebas de login.
 * Uso: node scripts/crearAdmin.js "correo@real.com" "PasswordSegura123" "Nombre Completo"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg, nombreArg] = process.argv;
  const email = (emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const passwordPlano = passwordArg || process.env.ADMIN_PASSWORD || '';
  const nombre = (nombreArg || process.env.ADMIN_NOMBRE || 'Director General').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Debes pasar un correo válido. Ejemplo: node scripts/crearAdmin.js "tu@correo.com" "TuClave123" "Tu Nombre"');
    process.exit(1);
  }
  if (!passwordPlano || passwordPlano.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ Falta DATABASE_URL en backend/.env');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(passwordPlano, 12);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { password: passwordHash, nombre, rol: 'DIRECTOR', activo: true },
    create: { email, password: passwordHash, nombre, rol: 'DIRECTOR', activo: true },
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });

  console.log('✅ Usuario DIRECTOR listo para login:');
  console.log(usuario);
  console.log('Ya puedes iniciar sesión con ese correo en el frontend.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
