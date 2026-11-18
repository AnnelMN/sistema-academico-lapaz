// Copia de seguridad de TODAS las tablas en un archivo JSON (control H).
// El plan gratuito de Supabase no ofrece copias descargables, así que esta es
// la copia propia del proyecto. Solo LEE la base de datos; no modifica nada.
//
//   node scripts/respaldarBD.js           → crea backend/respaldos/respaldo-AAAA-MM-DD-HHMM.json
//   node scripts/respaldarBD.js --ensayo  → solo cuenta las filas, no escribe ningún archivo
//
// IMPORTANTE: el archivo contiene datos personales, hashes de contraseñas y los
// secretos 2FA cifrados. La carpeta respaldos/ está en .gitignore (nunca se sube a
// GitHub). Guárdalo en un lugar privado (USB o carpeta con contraseña) y bórralo
// de la computadora cuando ya tengas la copia guardada.
// Los secretos 2FA solo se pueden leer con la misma TOTP_ENC_KEY: guárdala aparte.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Prisma } = require('@prisma/client');
const prisma = require('../src/lib/prisma');

const ENSAYO = process.argv.includes('--ensayo');

const aJSON = (_k, v) => (typeof v === 'bigint' ? v.toString() : v);

async function main() {
  const modelos = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const datos = {};
  let total = 0;

  for (const modelo of modelos) {
    const delegado = prisma[modelo.charAt(0).toLowerCase() + modelo.slice(1)];
    if (ENSAYO) {
      const n = await delegado.count();
      console.log(`  ${modelo}: ${n} filas`);
      total += n;
    } else {
      datos[modelo] = await delegado.findMany();
      total += datos[modelo].length;
    }
  }

  if (ENSAYO) {
    console.log(`Ensayo: ${modelos.length} tablas, ${total} filas. No se escribió ningún archivo.`);
    return;
  }

  const carpeta = path.join(__dirname, '..', 'respaldos');
  fs.mkdirSync(carpeta, { recursive: true });
  const fecha = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const archivo = path.join(carpeta, `respaldo-${fecha}.json`);
  const contenido = { creado: new Date().toISOString(), version: 1, tablas: datos };
  fs.writeFileSync(archivo, JSON.stringify(contenido, aJSON, 2), { mode: 0o600 });
  console.log(`Respaldo creado: ${modelos.length} tablas, ${total} filas → ${archivo}`);
}

main()
  .catch((e) => {
    console.error('No se pudo crear el respaldo:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
