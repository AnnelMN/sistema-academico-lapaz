const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { esContrasenaRobusta, MENSAJE_CONTRASENA } = require('../lib/validaciones');

// Huella del hash de la contraseña para el token de recuperación: un HMAC que
// no revela nada del hash (antes se enviaban sus primeros 16 caracteres) y que
// deja de servir en cuanto la contraseña cambia (token de un solo uso).
const claveHuella = () => crypto.createHash('sha256').update(`password-reset:${process.env.JWT_SECRET}`).digest();
const huellaDe = (hashContrasena) => crypto.createHmac('sha256', claveHuella()).update(hashContrasena).digest('base64url');
const huellasIguales = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const loginAttempts = new Map();
const twoFactorAttempts = new Map();
const passwordResetAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const isRateLimited = (attempts, key) => {
  const attempt = attempts.get(key);
  return Boolean(attempt && attempt.blockedUntil > Date.now());
};

const recordFailure = (attempts, key) => {
  const attempt = attempts.get(key) || { count: 0, blockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = Date.now() + LOCK_TIME_MS;
    attempt.count = 0;
  }
  attempts.set(key, attempt);
};

const clearFailures = (attempts, key) => {
  attempts.delete(key);
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const emailKey = String(email).trim().toLowerCase();
    if (isRateLimited(loginAttempts, emailKey)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intente en 15 minutos.' });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: emailKey },
      include: {
        estudiante: true,
        docente: true,
      }
    });

    if (!user || !user.activo) {
      recordFailure(loginAttempts, emailKey);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      recordFailure(loginAttempts, emailKey);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    clearFailures(loginAttempts, emailKey);

    // PASO 1 de 2FA: si tiene 2FA activo, emitir pre-token corto y pedir código TOTP.
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user.id, purpose: '2fa-pending' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ requires2FA: true, tempToken });
    }

    const secret = speakeasy.generateSecret({
      name: `UE La Paz A (${user.email})`,
      issuer: 'UE La Paz A',
      length: 32,
    });

    await prisma.usuario.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    const tempToken = jwt.sign(
      { id: user.id, purpose: '2fa-setup-pending' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      requiresSetup2FA: true,
      tempToken,
      qrDataUrl,
      manualKey: secret.base32,
    });

    const payload = {
      id: user.id,
      rol: user.rol,
      email: user.email,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        estudianteId: user.estudiante?.id,
        docenteId: user.docente?.id,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// POST /api/auth/2fa/authenticate — valida tempToken + TOTP y emite JWT final.
const authenticate = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !/^\d{6}$/.test(String(code || '').trim())) {
      return res.status(400).json({ error: 'Token temporal y código de 6 dígitos requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Sesión 2FA expirada, inicia de nuevo' });
    }

    if (decoded.purpose !== '2fa-pending') {
      return res.status(401).json({ error: 'Token no válido para 2FA' });
    }

    const attemptKey = `2fa:${decoded.id}`;
    if (isRateLimited(twoFactorAttempts, attemptKey)) {
      return res.status(429).json({ error: 'Demasiados códigos incorrectos. Espere 15 minutos.' });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { estudiante: true, docente: true },
    });

    if (!user || !user.activo || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const valido = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: String(code).trim(),
      window: 1,
    });

    if (!valido) {
      recordFailure(twoFactorAttempts, attemptKey);
      return res.status(401).json({ error: 'Código 2FA inválido' });
    }

    clearFailures(twoFactorAttempts, attemptKey);

    const token = jwt.sign(
      { id: user.id, rol: user.rol, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        estudianteId: user.estudiante?.id,
        docenteId: user.docente?.id,
      }
    });
  } catch (error) {
    console.error('2FA authenticate error:', error);
    res.status(500).json({ error: 'Error al verificar 2FA' });
  }
};

const setupAuthenticate = async (req, res) => {
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
      return res.status(401).json({ error: 'Token no válido para activar 2FA' });
    }

    const attemptKey = `setup:${decoded.id}`;
    if (isRateLimited(twoFactorAttempts, attemptKey)) {
      return res.status(429).json({ error: 'Demasiados códigos incorrectos. Espere 15 minutos.' });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { estudiante: true, docente: true },
    });

    if (!user || !user.activo || !user.twoFactorSecret) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const valido = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: String(code).trim(),
      window: 1,
    });

    if (!valido) {
      recordFailure(twoFactorAttempts, attemptKey);
      return res.status(401).json({ error: 'Código 2FA inválido' });
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
    clearFailures(twoFactorAttempts, attemptKey);

    const token = jwt.sign(
      { id: user.id, rol: user.rol, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        estudianteId: user.estudiante?.id,
        docenteId: user.docente?.id,
      },
    });
  } catch (error) {
    console.error('2FA setup authenticate error:', error);
    res.status(500).json({ error: 'No se pudo activar 2FA' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Correo requerido' });
    }

    const emailKey = String(email).trim().toLowerCase();
    const user = await prisma.usuario.findUnique({ where: { email: emailKey } });
    // Cuenta válida → HMAC del hash; si no, un valor aleatorio del mismo tamaño:
    // la respuesta es indistinguible y no permite saber si la cuenta existe.
    const fingerprint = user?.activo && user?.twoFactorEnabled && user?.twoFactorSecret
      ? huellaDe(user.password)
      : crypto.randomBytes(32).toString('base64url');

    const tempToken = jwt.sign(
      { email: emailKey, purpose: 'password-reset-pending', fingerprint },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      ok: true,
      message: 'Si la cuenta existe y tiene 2FA, ingrese el código de su app.',
      tempToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'No se pudo iniciar la recuperación' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { tempToken, code, newPassword } = req.body;
    if (!tempToken || !/^\d{6}$/.test(String(code || '').trim()) || !newPassword) {
      return res.status(400).json({ error: 'Token, código de 6 dígitos y nueva contraseña requeridos' });
    }
    if (!esContrasenaRobusta(newPassword)) {
      return res.status(400).json({ error: MENSAJE_CONTRASENA });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Sesión expirada, solicite recuperación de nuevo' });
    }

    if (decoded.purpose !== 'password-reset-pending' || !decoded.email) {
      return res.status(401).json({ error: 'Token no válido para recuperación' });
    }

    const resetKey = `reset:${decoded.email}`;
    if (isRateLimited(passwordResetAttempts, resetKey)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intente en 15 minutos.' });
    }

    const user = await prisma.usuario.findUnique({ where: { email: decoded.email } });
    const validFingerprint = Boolean(user?.password) && huellasIguales(huellaDe(user.password), decoded.fingerprint);

    if (!user || !user.activo || !user.twoFactorEnabled || !user.twoFactorSecret || !validFingerprint) {
      recordFailure(passwordResetAttempts, resetKey);
      return res.status(401).json({ error: 'No se pudo restablecer la contraseña' });
    }

    const valido = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: String(code).trim(),
      window: 1,
    });

    if (!valido) {
      recordFailure(passwordResetAttempts, resetKey);
      return res.status(401).json({ error: 'Código 2FA inválido' });
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 12) },
    });

    clearFailures(passwordResetAttempts, resetKey);
    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        twoFactorEnabled: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Server error fetching user info' });
  }
};

module.exports = {
  login,
  authenticate,
  setupAuthenticate,
  forgotPassword,
  resetPassword,
  getMe,
};
