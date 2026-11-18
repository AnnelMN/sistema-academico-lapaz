// QR DINÁMICO de asistencia.
//
// Cada estudiante ve en su celular un QR que cambia cada 30 segundos. El
// contenido es solo un código aleatorio: HMAC-SHA256(QR_SECRET, id del estudiante
// + número de ventana de 30 s). No lleva nombre, CI, correo ni el id interno, y
// sin QR_SECRET (que nunca sale del servidor) es imposible fabricar uno válido.
// Una captura de pantalla deja de servir en menos de 1 minuto.
//
// El servidor reconoce al estudiante recalculando el código de cada estudiante y
// comparándolo en tiempo constante. No se guarda nada en la base de datos.
const crypto = require('crypto');
const { accionDe, registrarCambios } = require('./auditoriaService');
const { esClaveValida } = require('../lib/secretos');

const PREFIJO = 'UELPA-QR1:';
const VENTANA_MS = 30 * 1000;
const VENTANAS_ACEPTADAS = 2;          // la actual y la anterior (máx. 60 s de validez)
const LARGO_CODIGO = 22;                // 22 caracteres base64url ≈ 128 bits
const FORMATO = new RegExp(`^${PREFIJO.replace(/[-]/g, '\\-')}[A-Za-z0-9_-]{${LARGO_CODIGO}}$`);

const claveQR = () => {
  // Sin clave, con el valor de ejemplo o demasiado corta → QR desactivado (C-01)
  const clave = process.env.QR_SECRET || '';
  return esClaveValida(clave) ? clave : null;
};
const qrConfigurado = () => claveQR() !== null;

const ventanaDe = (ms) => Math.floor(ms / VENTANA_MS);

const codigoPara = (estudianteId, ventana, clave = claveQR()) => crypto
  .createHmac('sha256', clave)
  .update(`asistencia-qr:v1:${estudianteId}:${ventana}`)
  .digest('base64url')
  .slice(0, LARGO_CODIGO);

// Contenido del QR que ve el estudiante ahora, y cuándo cambia
function generarContenido(estudianteId, ahora = Date.now()) {
  if (!qrConfigurado()) throw new Error('QR_SECRET no configurado');
  const ventana = ventanaDe(ahora);
  return {
    contenido: PREFIJO + codigoPara(estudianteId, ventana),
    expiraEn: new Date((ventana + 1) * VENTANA_MS).toISOString(),
    segundosRestantes: Math.ceil(((ventana + 1) * VENTANA_MS - ahora) / 1000),
  };
}

const esFormatoValido = (texto) => typeof texto === 'string' && texto.length <= 64 && FORMATO.test(texto);

// Devuelve el id del estudiante dueño del código, o null si es inválido o venció.
// candidatos: ids de estudiantes entre los que buscar.
function identificar(texto, candidatos, ahora = Date.now()) {
  if (!qrConfigurado() || !esFormatoValido(texto)) return null;
  const recibido = Buffer.from(texto.slice(PREFIJO.length));
  const actual = ventanaDe(ahora);
  let encontrado = null;
  for (let v = actual; v > actual - VENTANAS_ACEPTADAS; v -= 1) {
    for (const id of candidatos) {
      const esperado = Buffer.from(codigoPara(id, v));
      // Se recorren todos (sin cortar) para no revelar información por el tiempo de respuesta
      if (crypto.timingSafeEqual(esperado, recibido) && encontrado === null) encontrado = id;
    }
  }
  return encontrado;
}

// Registra PRESENTE por QR dentro de una transacción (tx).
// Nunca modifica un registro existente: si ya hay asistencia ese día (de
// cualquier estado), la devuelve tal cual. Deja el registro en la auditoría.
async function registrarPresente(tx, { estudianteId, materiaProgramadaId, fecha, fechaDate, usuarioId }) {
  const clave = { estudianteId_materiaProgramadaId_fecha: { estudianteId, materiaProgramadaId, fecha: fechaDate } };
  const existente = await tx.asistencia.findUnique({ where: clave, select: { estado: true } });
  if (existente) return { creado: false, estado: existente.estado };

  await tx.asistencia.create({
    data: { estudianteId, materiaProgramadaId, fecha: fechaDate, estado: 'PRESENTE' },
  });
  await registrarCambios(tx, [{
    entidad: 'ASISTENCIA',
    accion: accionDe(null, 'PRESENTE'),
    materiaProgramadaId,
    estudianteId,
    usuarioId,
    valorNuevo: { fecha, estado: 'PRESENTE', origen: 'QR' },
  }]);
  return { creado: true, estado: 'PRESENTE' };
}

module.exports = {
  PREFIJO, VENTANA_MS,
  qrConfigurado, generarContenido, esFormatoValido, identificar, registrarPresente,
  _internos: { codigoPara, ventanaDe },
};
