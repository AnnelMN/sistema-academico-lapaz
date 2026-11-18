// LB-07: las cuentas INACTIVAS (de prueba) tienen contraseñas que quedaron en el
// historial de Git. Como no se volverán a usar, se les asigna una contraseña
// aleatoria que nadie conoce (no se muestra ni se guarda) y se cierran sus
// sesiones. Así, aunque alguien las reactive por error, la contraseña filtrada
// ya no sirve. Si algún día se necesita una, el Director le pone una nueva
// desde Usuarios.
//
//   node scripts/invalidarContrasenasInactivas.js --ensayo → solo cuenta, no cambia nada
//   node scripts/invalidarContrasenasInactivas.js          → aplica el cambio
require('dotenv').config({ quiet: true });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const ENSAYO = process.argv.includes('--ensayo');

async function main() {
  const inactivos = await prisma.usuario.findMany({
    where: { activo: false },
    select: { id: true, rol: true },
  });
  const porRol = inactivos.reduce((a, u) => ({ ...a, [u.rol]: (a[u.rol] || 0) + 1 }), {});
  console.log(`Cuentas inactivas: ${inactivos.length}`, porRol);

  if (ENSAYO || inactivos.length === 0) {
    console.log(ENSAYO ? 'Ensayo: no se cambió nada.' : 'Nada que cambiar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const u of inactivos) {
      const hash = await bcrypt.hash(crypto.randomBytes(32).toString('base64url'), 12);
      await tx.usuario.update({
        where: { id: u.id },
        data: { password: hash, tokenVersion: { increment: 1 } },
      });
    }
  }, { timeout: 60000 });
  console.log(`Listo: ${inactivos.length} contraseñas reemplazadas por valores aleatorios y sesiones cerradas.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
