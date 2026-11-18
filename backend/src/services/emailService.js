const nodemailer = require('nodemailer');

// ════════════════════════════════════════════════════════════════════
// Correos del sistema (código de acceso, notificaciones y alertas a tutores).
// - Todo dato que viene de usuarios (nombres, materias, mensajes) se ESCAPA
//   antes de insertarse en el HTML: así nadie puede inyectar enlaces o HTML
//   en los correos que reciben los padres.
// - Los asuntos son texto plano sin saltos de línea.
// - En los registros del servidor los correos aparecen enmascarados (a***@dominio).
// ════════════════════════════════════════════════════════════════════

const crearTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Texto para asuntos: sin saltos de línea ni caracteres de control, longitud acotada
const textoPlano = (value, max = 120) => String(value ?? '')
  .replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ')
  .trim()
  .slice(0, max);

// a***@dominio.com — para registros del servidor
const enmascararEmail = (email) => {
  const [usuario, dominio] = String(email || '').split('@');
  return dominio ? `${usuario.slice(0, 1)}***@${dominio}` : '***';
};

const remitente = () => `"Sistema Académico UELA" <${process.env.EMAIL_USER}>`;

const plantilla = (color, titulo, cuerpo) => `
  <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
    <h2 style="color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 10px;">${titulo}</h2>
    ${cuerpo}
    <br/>
    <p style="font-size: 0.9em; color: #666;">Atentamente,</p>
    <p style="font-size: 0.9em; color: #666; font-weight: bold;">Dirección Académica - Unidad Educativa La Paz "A"</p>
  </div>
`;

async function enviar({ to, subject, html, etiqueta }) {
  const info = await crearTransporter().sendMail({ from: remitente(), to, subject, html });
  console.log(`${etiqueta} enviado a ${enmascararEmail(to)} [ID: ${info.messageId}]`);
  return info;
}

exports.enviarCodigoVerificacion = async (emailDestino, nombre, codigo) => enviar({
  to: emailDestino,
  subject: 'Tu código de acceso - UELA',
  etiqueta: 'Código de acceso',
  html: plantilla('#1a73e8', 'Código de verificación - Sistema UELA', `
    <p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
    <p>Tu código de acceso es:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #f1f5f9; padding: 12px 24px; border-radius: 8px;">${escapeHtml(codigo)}</span>
    </div>
    <p>Este código <strong>expira en 5 minutos</strong> y es de un solo uso. Si no solicitaste este acceso, ignora este mensaje.</p>
  `),
});

exports.enviarNotificacionManual = async (emailDestino, estudianteNombre, tipoLabel, mensaje) => enviar({
  to: emailDestino,
  subject: `Notificación académica - ${textoPlano(estudianteNombre)}`,
  etiqueta: 'Notificación manual',
  html: plantilla('#1a73e8', 'Notificación Académica - Sistema UELA', `
    <p>Estimado/a Tutor/a,</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Estudiante:</strong> ${escapeHtml(estudianteNombre)}</p>
      <p><strong>Motivo:</strong> ${escapeHtml(tipoLabel)}</p>
      <p>${escapeHtml(mensaje).replace(/\n/g, '<br />')}</p>
    </div>
  `),
});

exports.enviarAlertaRiesgo = async (estudianteNombre, materia, riesgoInfo, emailDestino) => {
  try {
    const probabilidad = (Number(riesgoInfo?.probabilidad) * 100).toFixed(1);
    return await enviar({
      to: emailDestino,
      subject: `Alerta Urgente de Rendimiento - ${textoPlano(estudianteNombre)}`,
      etiqueta: 'Alerta de riesgo',
      html: plantilla('#d32f2f', 'Alerta Académica - Sistema UELA', `
        <p>Estimado/a Tutor/a,</p>
        <p>Le informamos que el sistema predictivo ha detectado un nivel de <strong>Riesgo Alto</strong> en el rendimiento académico del estudiante.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Estudiante:</strong> ${escapeHtml(estudianteNombre)}</li>
            <li style="margin-bottom: 10px;"><strong>Materia:</strong> ${escapeHtml(materia)}</li>
            <li style="margin-bottom: 10px;"><strong>Nivel de Riesgo:</strong> <span style="color: #d32f2f; font-weight: bold;">ALTO</span></li>
            <li><strong>Probabilidad calculada:</strong> ${escapeHtml(probabilidad)}%</li>
          </ul>
        </div>
        <p>Le sugerimos ponerse en contacto con el docente o la dirección de la unidad educativa a la brevedad posible para conversar sobre estrategias de apoyo y mejorar la situación académica del estudiante.</p>
      `),
    });
  } catch (error) {
    console.error('Error enviando correo de alerta:', error.message);
    throw error;
  }
};

exports.enviarAlertaInasistencia = async (estudianteNombre, materia, faltas, limite, emailDestino) => {
  try {
    return await enviar({
      to: emailDestino,
      subject: `Alerta de Inasistencia - ${textoPlano(estudianteNombre)}`,
      etiqueta: 'Alerta de inasistencia',
      html: plantilla('#e65100', 'Alerta de Inasistencia - Sistema UELA', `
        <p>Estimado/a Tutor/a,</p>
        <p>Le informamos que el estudiante ha superado el límite permitido de inasistencias en una materia.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Estudiante:</strong> ${escapeHtml(estudianteNombre)}</li>
            <li style="margin-bottom: 10px;"><strong>Materia:</strong> ${escapeHtml(materia)}</li>
            <li style="margin-bottom: 10px;"><strong>Faltas acumuladas:</strong> <span style="color: #e65100; font-weight: bold;">${escapeHtml(faltas)}</span></li>
            <li><strong>Límite permitido:</strong> ${escapeHtml(limite)}</li>
          </ul>
        </div>
        <p>Le sugerimos conversar con el estudiante y el docente para tomar las medidas necesarias.</p>
      `),
    });
  } catch (error) {
    console.error('Error enviando correo de inasistencia:', error.message);
    throw error;
  }
};

// Para pruebas
exports._internos = { escapeHtml, textoPlano, enmascararEmail };
