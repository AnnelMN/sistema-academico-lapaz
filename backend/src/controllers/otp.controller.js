const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { cifrar, descifrar } = require('../lib/cifrado');
const { enviarCodigoVerificacion } = require('../services/emailService');

const OTP_TTL_MIN = 5;       // vigencia del código
const OTP_MAX_INTENTOS = 5;  // intentos antes de invalidar
const RESEND_COOLDOWN_SEG = 60;

// Límite simple anti fuerza bruta en memoria (por email).
const fallosLogin = new Map(); // email -> { count, bloqueadoHasta }
const MAX_FALLOS = 10;
const BLOQUEO_MIN = 10;

// HMAC del código con una clave derivada de JWT_SECRET (separada por propósito).
// Sin valor por defecto: si falta JWT_SECRET, falla en lugar de usar una clave conocida.
// Nota: este controlador no está conectado a ninguna ruta (hallazgo LB-19).
function hashCodigo(codigo) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no está configurado');
  const clave = crypto.createHash('sha256').update(`email-otp:${process.env.JWT_SECRET}`).digest();
  return crypto.createHmac('sha256', clave).update(String(codigo)).digest('hex');
}

function generarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function compararSeguro(a, b) {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function emailEnmascarado(email) {
  const [u, d] = String(email).split('@');
  if (!d) return '***';
  return `${u[0]}***@${d}`;
}

function emitirTempToken(userId) {
  return jwt.sign(
    { id: userId, purpose: 'email-otp-pending' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function emitirJWT(user) {
  return jwt.sign(
    { id: user.id, rol: user.rol, email: user.email, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function payloadUsuario(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    estudianteId: user.estudiante?.id,
    docenteId: user.docente?.id,
  };
}

async function crearYEnviarOTP(user) {
  // Invalida códigos anteriores pendientes.
  await prisma.codigoVerificacion.updateMany({
    where: { usuarioId: user.id, usado: false },
    data: { usado: true },
  });

  const codigo = generarCodigo();
  const expiraEn = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

  await prisma.codigoVerificacion.create({
    data: { usuarioId: user.id, codigoHash: hashCodigo(codigo), expiraEn },
  });

  await enviarCodigoVerificacion(user.email, user.nombre, codigo);

  return { tempToken: emitirTempToken(user.id), emailMask: emailEnmascarado(user.email) };
}

function loginBloqueado(email) {
  const r = fallosLogin.get(email);
  return r && r.bloqueadoHasta > Date.now();
}

function registrarFallo(email) {
  const r = fallosLogin.get(email) || { count: 0, bloqueadoHasta: 0 };
  r.count += 1;
  if (r.count >= MAX_FALLOS) {
    r.bloqueadoHasta = Date.now() + BLOQUEO_MIN * 60 * 1000;
    r.count = 0;
  }
  fallosLogin.set(email, r);
}

// POST /api/auth/login — Paso 1: email+password.
// Si el usuario ya tiene app activada → pide su código.
// Si no → devuelve el QR para escanear y activar en el mismo paso.
const loginConOTP = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Debe indicar email y contraseña' });
    }

    if (loginBloqueado(email)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intente en 10 minutos.' });
    }

    const bcrypt = require('bcryptjs');
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { estudiante: true, docente: true },
    });

    if (!user || !user.activo) {
      registrarFallo(email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      registrarFallo(email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    fallosLogin.delete(email);

    // Si el usuario tiene app Authenticator activada, el código lo genera su app.
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user.id, purpose: '2fa-pending' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ requires2FA: true, tempToken });
    }

    // Si aún no tiene app registrada: el login muestra el QR para escanear
    // y activar en el mismo paso. Solo ocurre hasta que se activa.
    try {
      const speakeasy = require('speakeasy');
      const QRCode = require('qrcode');

      let secret = descifrar(user.twoFactorSecret);
      if (!secret) {
        const s = speakeasy.generateSecret({
          name: `UELA La Paz A (${user.email})`,
          issuer: 'UELA La Paz A',
          length: 32,
        });
        secret = s.base32;
        await prisma.usuario.update({ where: { id: user.id }, data: { twoFactorSecret: cifrar(secret) } });
      }

      const otpauth = speakeasy.otpauthURL({
        secret, encoding: 'base32',
        label: `UELA La Paz A (${user.email})`,
        issuer: 'UELA La Paz A',
      });
      const qrDataUrl = await QRCode.toDataURL(otpauth);
      const tempToken = jwt.sign(
        { id: user.id, purpose: '2fa-setup-pending' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ requiresSetup2FA: true, tempToken, qrDataUrl });
    } catch (qrErr) {
      console.error('Error generando QR:', qrErr);
      return res.status(500).json({ error: 'No se pudo generar el QR. Intente de nuevo.' });
    }
  } catch (error) {
    console.error('Login OTP error:', error);
    res.status(500).json({ error: 'Error del servidor durante el login' });
  }
};

function verificarTempToken(tempToken) {
  try {
    const d = jwt.verify(tempToken, process.env.JWT_SECRET);
    return d.purpose === 'email-otp-pending' ? d : null;
  } catch {
    return null;
  }
}

// POST /api/auth/otp/verify — Paso 2: valida código de 6 dígitos, emite JWT.
const verifyOTP = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !/^\d{6}$/.test(String(code || '').trim())) {
      return res.status(400).json({ error: 'Token y código de 6 dígitos requeridos' });
    }

    const decoded = verificarTempToken(tempToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Sesión expirada, inicie de nuevo' });
    }

    const registro = await prisma.codigoVerificacion.findFirst({
      where: { usuarioId: decoded.id, usado: false },
      orderBy: { creadoEn: 'desc' },
    });

    if (!registro) {
      return res.status(401).json({ error: 'No hay código pendiente. Solicite uno nuevo.' });
    }
    if (registro.expiraEn < new Date()) {
      await prisma.codigoVerificacion.update({ where: { id: registro.id }, data: { usado: true } });
      return res.status(401).json({ error: 'Código expirado. Solicite uno nuevo.' });
    }
    if (registro.intentos >= OTP_MAX_INTENTOS) {
      await prisma.codigoVerificacion.update({ where: { id: registro.id }, data: { usado: true } });
      return res.status(401).json({ error: 'Demasiados intentos. Solicite un código nuevo.' });
    }

    if (!compararSeguro(hashCodigo(String(code).trim()), registro.codigoHash)) {
      await prisma.codigoVerificacion.update({
        where: { id: registro.id },
        data: { intentos: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    await prisma.codigoVerificacion.update({ where: { id: registro.id }, data: { usado: true } });

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { estudiante: true, docente: true },
    });
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    res.json({ token: emitirJWT(user), user: payloadUsuario(user) });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Error al verificar el código' });
  }
};

// POST /api/auth/otp/reenviar — reenvía código (cooldown 60s).
const reenviarOTP = async (req, res) => {
  try {
    const { tempToken } = req.body;
    const decoded = verificarTempToken(tempToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Sesión expirada, inicie de nuevo' });
    }

    const ultimo = await prisma.codigoVerificacion.findFirst({
      where: { usuarioId: decoded.id },
      orderBy: { creadoEn: 'desc' },
    });
    if (ultimo && Date.now() - new Date(ultimo.creadoEn).getTime() < RESEND_COOLDOWN_SEG * 1000) {
      return res.status(429).json({ error: 'Espere 60 segundos antes de reenviar' });
    }

    const user = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    try {
      const otp = await crearYEnviarOTP(user);
      return res.json({ ok: true, ...otp });
    } catch (mailErr) {
      console.error('Error reenviando OTP:', mailErr);
      return res.status(500).json({ error: 'No se pudo reenviar el código. Intente de nuevo.' });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Error al reenviar el código' });
  }
};

// POST /api/auth/2fa/activar-login — valida el código de la app recién
// escaneada, activa el 2FA y emite el JWT final.
const activarDesdeLogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !/^\d{6}$/.test(String(code || '').trim())) {
      return res.status(400).json({ error: 'Token y código de 6 dígitos requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Sesión expirada, ingrese de nuevo' });
    }
    if (decoded.purpose !== '2fa-setup-pending') {
      return res.status(401).json({ error: 'Sesión no válida para activación' });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { estudiante: true, docente: true },
    });
    if (!user || !user.activo || !user.twoFactorSecret) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const speakeasy = require('speakeasy');
    const valido = speakeasy.totp.verify({
      secret: descifrar(user.twoFactorSecret),
      encoding: 'base32',
      token: String(code).trim(),
      window: 1,
    });
    if (!valido) return res.status(401).json({ error: 'Código incorrecto' });

    await prisma.usuario.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });

    res.json({ token: emitirJWT(user), user: payloadUsuario(user) });
  } catch (error) {
    console.error('Activar 2FA desde login error:', error);
    res.status(500).json({ error: 'Error al activar' });
  }
};

module.exports = { loginConOTP, verifyOTP, reenviarOTP, activarDesdeLogin };
