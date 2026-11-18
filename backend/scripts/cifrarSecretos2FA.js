// Cifra los secretos 2FA que aún estén en texto plano (hallazgo LB-08).
//   node scripts/cifrarSecretos2FA.js --ensayo   → prueba todo y lo deshace
//   node scripts/cifrarSecretos2FA.js            → aplica el cifrado
// Requiere TOTP_ENC_KEY en backend/.env. Es idempotente: los secretos ya
// cifrados no se tocan. Antes de guardar, comprueba que cada secreto se pueda
// descifrar y dé exactamente el original; si alguno falla, no se guarda nada.
// Nunca imprime secretos.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { cifrar, descifrar, estaCifrado, obtenerClave } = require('../src/lib/cifrado');

const prisma = new PrismaClient();
const ensayo = process.argv.includes('--ensayo');
class Ensayo extends Error {}

async function main() {
  if (!obtenerClave()) {
    throw new Error('TOTP_ENC_KEY no está configurada (64 caracteres hexadecimales) en backend/.env');
  }

  let cifrados = 0;
  await prisma.$transaction(async (tx) => {
    const usuarios = await tx.usuario.findMany({
      where: { twoFactorSecret: { not: null } },
      select: { id: true, twoFactorSecret: true },
    });
    const pendientes = usuarios.filter((u) => !estaCifrado(u.twoFactorSecret));
    console.log(`Usuarios con secreto 2FA: ${usuarios.length} · en texto plano: ${pendientes.length}`);

    for (const u of pendientes) {
      const cifrado = cifrar(u.twoFactorSecret);
      if (descifrar(cifrado) !== u.twoFactorSecret) {
        throw new Error('La verificación del cifrado falló; no se guardó ningún cambio');
      }
      await tx.usuario.update({ where: { id: u.id }, data: { twoFactorSecret: cifrado } });
      cifrados += 1;
    }

    const restantes = (await tx.usuario.findMany({
      where: { twoFactorSecret: { not: null } }, select: { twoFactorSecret: true },
    })).filter((u) => !estaCifrado(u.twoFactorSecret)).length;
    console.log(`Cifrados ahora: ${cifrados} · en texto plano después: ${restantes}`);
    if (restantes !== 0) throw new Error('Quedaron secretos sin cifrar; no se guardó ningún cambio');
    if (ensayo) throw new Ensayo();
  }, { maxWait: 10000, timeout: 60000 });
}

main()
  .then(() => console.log(ensayo ? '' : 'Listo: todos los secretos 2FA están cifrados.'))
  .catch((error) => {
    if (error instanceof Ensayo) {
      console.log('ENSAYO COMPLETO: todo funcionó y no se guardó ningún cambio.');
      return;
    }
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
