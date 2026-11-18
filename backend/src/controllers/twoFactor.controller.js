const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { cifrar, descifrar } = require('../lib/cifrado');

// POST /api/auth/2fa/setup — requiere JWT final. Genera secreto y QR.
const setup = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user || !user.activo) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.twoFactorEnabled) return res.status(400).json({ error: 'El 2FA ya está activado' });

    const secret = speakeasy.generateSecret({
      name: `UE La Paz A (${user.email})`,
      issuer: 'UE La Paz A',
      length: 32,
    });

    await prisma.usuario.update({
      where: { id: user.id },
      data: { twoFactorSecret: cifrar(secret.base32), twoFactorEnabled: false },
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({ qrDataUrl, manualKey: secret.base32 });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Error al generar 2FA' });
  }
};

// POST /api/auth/2fa/verify-setup { code } — requiere JWT. Activa el 2FA.
const verifySetup = async (req, res) => {
  try {
    const { code } = req.body;
    if (!/^\d{6}$/.test(String(code || '').trim())) {
      return res.status(400).json({ error: 'Código de 6 dígitos requerido' });
    }

    const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user?.twoFactorSecret) {
      return res.status(400).json({ error: 'Primero genera el secreto (setup)' });
    }

    const valido = speakeasy.totp.verify({
      secret: descifrar(user.twoFactorSecret),
      encoding: 'base32',
      token: String(code).trim(),
      window: 1,
    });

    if (!valido) return res.status(401).json({ error: 'Código inválido' });

    await prisma.usuario.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    res.json({ ok: true, message: '2FA activado correctamente' });
  } catch (err) {
    console.error('2FA verify-setup error:', err);
    res.status(500).json({ error: 'Error al activar 2FA' });
  }
};

// POST /api/auth/2fa/disable { password } — requiere JWT final. Desactiva el 2FA.
const disable = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { password } = req.body;
    const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    await prisma.usuario.update({
      where: { id: user.id },
      // Sin 2FA → se cierran todas las sesiones abiertas
      data: { twoFactorSecret: null, twoFactorEnabled: false, tokenVersion: { increment: 1 } },
    });

    res.json({ ok: true, message: '2FA desactivado' });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Error al desactivar 2FA' });
  }
};

module.exports = { setup, verifySetup, disable };
