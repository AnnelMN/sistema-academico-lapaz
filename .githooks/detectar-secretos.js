#!/usr/bin/env node
// Revisa lo que está por guardarse en Git (git add) y BLOQUEA el commit si
// encuentra secretos: archivos .env, tokens JWT, claves privadas, URLs de base
// de datos con contraseña, hashes bcrypt, claves de 64 caracteres, etc.
// Control D de la Skill web-security-audit. No necesita instalar nada.
//
// Se activa con:  git config core.hooksPath .githooks
// Para un falso positivo, agregar al final de esa línea:  // permitir-secreto
const { execFileSync } = require('child_process');

// Se llama a git SIN pasar por el shell: un nombre de archivo nunca se interpreta como comando (C-02)
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// -z: nombres separados por \0 y sin comillas (admite cualquier carácter)
const archivos = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split('\0').filter(Boolean);
const hallazgos = [];

// 1. Archivos que nunca deben subirse
for (const f of archivos) {
  const nombre = f.split('/').pop();
  if (/^\.env(\..+)?$/.test(nombre) && !nombre.endsWith('.example')) hallazgos.push(`${f}: archivo de variables de entorno`);
  if (/\.(pem|key|p12|pfx)$/i.test(nombre)) hallazgos.push(`${f}: archivo de clave privada`);
  if (/(^|\/)respaldos\//.test(f)) hallazgos.push(`${f}: copia de seguridad de la base de datos`);
}

// 2. Contenido agregado
const PATRONES = [
  [/eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, 'token JWT'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/postgres(ql)?:\/\/[^:\s'"]+:(?!password@|\*+@|<)[^@\s'"]{4,}@/i, 'URL de base de datos con contraseña'],
  [/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/, 'hash de contraseña bcrypt'],
  [/(?<![0-9a-fA-F])[0-9a-f]{64}(?![0-9a-fA-F])/, 'clave hexadecimal de 64 caracteres (¿TOTP_ENC_KEY, IA_API_KEY, JWT_SECRET?)'],
  [/\bv1:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]{20,}/, 'secreto 2FA cifrado'],
  [/(sb_secret_|sk_live_|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-)/, 'clave de servicio (Supabase/Stripe/AWS/GitHub/Slack)'],
  [/\b(password|passwd|contraseña|secret|api[_-]?key|token)\b\s*[:=]\s*['"](?!cambia_esto|<|\*{3}|example|ejemplo|tu_|\$\{)[^'"\s]{8,}['"]/i, 'posible contraseña o clave escrita en el código'],
];

// Se omiten los lockfiles (hashes de integridad) y este mismo archivo (contiene los patrones).
const IGNORAR = /(^|\/)(package-lock\.json|.*\.lock|\.githooks\/detectar-secretos\.js)$/;
for (const f of archivos) {
  if (IGNORAR.test(f)) continue;
  let diff;
  try { diff = git('diff', '--cached', '-U0', '--', f); } catch { continue; }
  let linea = 0;
  for (const l of diff.split('\n')) {
    const cab = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (cab) { linea = Number(cab[1]) - 1; continue; }
    if (!l.startsWith('+') || l.startsWith('+++')) continue;
    linea += 1;
    if (l.includes('permitir-secreto')) continue;
    for (const [patron, tipo] of PATRONES) {
      if (patron.test(l)) { hallazgos.push(`${f}:${linea}: ${tipo}`); break; }
    }
  }
}

if (hallazgos.length) {
  console.error('\n⛔ Commit BLOQUEADO: posibles secretos en los cambios:\n');
  for (const h of hallazgos) console.error(`   • ${h}`);
  console.error('\nQuita el secreto (debe ir en .env, que no se sube) y vuelve a intentar.');
  console.error('Si es un falso positivo, agrega "// permitir-secreto" al final de esa línea.\n');
  process.exit(1);
}
