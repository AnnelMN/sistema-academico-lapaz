const prisma = require('../lib/prisma');
const { enviarNotificacionManual } = require('../services/emailService');

const TIPO_LABELS = {
  RIESGO_ALTO: 'Riesgo alto',
  EXCESO_FALTAS: 'Exceso de faltas',
};

const getNotificaciones = async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [historial, enviadasHoy, esteMes, pendientes, estudiantes] = await Promise.all([
      prisma.notificacion.findMany({
        orderBy: { enviadoEn: 'desc' },
        take: 100,
        include: {
          estudiante: {
            select: {
              emailTutor: true,
              usuario: { select: { nombre: true, activo: true } },
            },
          },
        },
      }),
      prisma.notificacion.count({
        where: { estadoEnvio: 'ENVIADO', enviadoEn: { gte: startToday } },
      }),
      prisma.notificacion.count({
        where: { estadoEnvio: 'ENVIADO', enviadoEn: { gte: startMonth } },
      }),
      prisma.notificacion.count({ where: { estadoEnvio: 'PENDIENTE' } }),
      prisma.estudiante.findMany({
        where: {
          emailTutor: { not: '' },
          usuario: { activo: true },
        },
        select: {
          id: true,
          emailTutor: true,
          usuario: { select: { nombre: true } },
        },
        orderBy: { usuario: { nombre: 'asc' } },
      }),
    ]);

    res.json({
      kpis: {
        enviadasHoy,
        esteMes,
        pendientes,
        padresRegistrados: estudiantes.length,
      },
      historial: historial.map((notificacion) => ({
        id: notificacion.id,
        estudiante: notificacion.estudiante.usuario.nombre,
        tipo: notificacion.tipo,
        estado: notificacion.estadoEnvio,
        destinatario: notificacion.emailDestino,
        fecha: notificacion.enviadoEn,
        mensaje: notificacion.mensaje,
      })),
      estudiantes: estudiantes.map((estudiante) => ({
        id: estudiante.id,
        nombre: estudiante.usuario.nombre,
        emailTutor: estudiante.emailTutor,
      })),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const enviarManual = async (req, res) => {
  try {
    const { estudianteId, tipo, mensaje } = req.body;
    const mensajeLimpio = String(mensaje || '').trim();

    if (!estudianteId || !tipo || !mensajeLimpio) {
      return res.status(400).json({ error: 'Estudiante, tipo y mensaje son requeridos' });
    }

    if (!Object.keys(TIPO_LABELS).includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de notificación inválido' });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      include: { usuario: { select: { nombre: true, activo: true } } },
    });

    if (!estudiante || !estudiante.usuario.activo) {
      return res.status(404).json({ error: 'Estudiante no encontrado o inactivo' });
    }

    if (!estudiante.emailTutor) {
      return res.status(400).json({ error: 'El estudiante no tiene correo de tutor registrado' });
    }

    try {
      await enviarNotificacionManual(
        estudiante.emailTutor,
        estudiante.usuario.nombre,
        TIPO_LABELS[tipo],
        mensajeLimpio
      );

      const notificacion = await prisma.notificacion.create({
        data: {
          estudianteId: estudiante.id,
          tipo,
          emailDestino: estudiante.emailTutor,
          estadoEnvio: 'ENVIADO',
          mensaje: mensajeLimpio,
        },
      });

      return res.status(201).json({ ok: true, notificacion });
    } catch (emailError) {
      console.error('Manual notification email failed:', emailError);

      const notificacion = await prisma.notificacion.create({
        data: {
          estudianteId: estudiante.id,
          tipo,
          emailDestino: estudiante.emailTutor,
          estadoEnvio: 'FALLIDO',
          mensaje: mensajeLimpio,
        },
      });

      return res.status(502).json({
        error: 'No se pudo enviar el correo; quedó registrado como fallido',
        notificacion,
      });
    }
  } catch (error) {
    console.error('Manual notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getNotificaciones,
  enviarManual,
};
