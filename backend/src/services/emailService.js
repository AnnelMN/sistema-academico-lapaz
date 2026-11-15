const nodemailer = require('nodemailer');

const crearTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

exports.enviarCodigoVerificacion = async (emailDestino, nombre, codigo) => {
  const transporter = crearTransporter();

  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">Código de verificación - Sistema UELA</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu código de acceso es:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #f1f5f9; padding: 12px 24px; border-radius: 8px;">${codigo}</span>
      </div>
      <p>Este código <strong>expira en 5 minutos</strong> y es de un solo uso. Si no solicitaste este acceso, ignora este mensaje.</p>
      <br/>
      <p style="font-size: 0.9em; color: #666;">Atentamente,</p>
      <p style="font-size: 0.9em; color: #666; font-weight: bold;">Dirección Académica - Unidad Educativa La Paz "A"</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Sistema Académico UELA" <${process.env.EMAIL_USER}>`,
    to: emailDestino,
    subject: 'Tu código de acceso - UELA',
    html: htmlContent,
  });

  console.log(`Código OTP enviado a ${emailDestino} [ID: ${info.messageId}]`);
  return info;
};

exports.enviarNotificacionManual = async (emailDestino, estudianteNombre, tipoLabel, mensaje) => {
  const transporter = crearTransporter();
  const safeNombre = escapeHtml(estudianteNombre);
  const safeTipo = escapeHtml(tipoLabel);
  const safeMensaje = escapeHtml(mensaje).replace(/\n/g, '<br />');

  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">Notificación Académica - Sistema UELA</h2>
      <p>Estimado/a Tutor/a,</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Estudiante:</strong> ${safeNombre}</p>
        <p><strong>Motivo:</strong> ${safeTipo}</p>
        <p>${safeMensaje}</p>
      </div>
      <br/>
      <p style="font-size: 0.9em; color: #666;">Atentamente,</p>
      <p style="font-size: 0.9em; color: #666; font-weight: bold;">Dirección Académica - Unidad Educativa La Paz "A"</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Sistema Académico UELA" <${process.env.EMAIL_USER}>`,
    to: emailDestino,
    subject: `Notificación académica - ${safeNombre}`,
    html: htmlContent,
  });

  console.log(`Notificación manual enviada a ${emailDestino} [ID: ${info.messageId}]`);
  return info;
};

exports.enviarAlertaRiesgo = async (estudianteNombre, materia, riesgoInfo, emailDestino) => {
  try {
    // Configuración del transporter. Si se usa Mailtrap, se pueden configurar 
    // estas variables en el .env (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlContent = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">Alerta Académica - Sistema UELA</h2>
        <p>Estimado/a Tutor/a,</p>
        <p>Le informamos que el sistema predictivo ha detectado un nivel de <strong>Riesgo Alto</strong> en el rendimiento académico del estudiante.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Estudiante:</strong> ${estudianteNombre}</li>
            <li style="margin-bottom: 10px;"><strong>Materia:</strong> ${materia}</li>
            <li style="margin-bottom: 10px;"><strong>Nivel de Riesgo:</strong> <span style="color: #d32f2f; font-weight: bold;">ALTO</span></li>
            <li><strong>Probabilidad calculada:</strong> ${(riesgoInfo.probabilidad * 100).toFixed(1)}%</li>
          </ul>
        </div>
        
        <p>Le sugerimos ponerse en contacto con el docente o la dirección de la unidad educativa a la brevedad posible para conversar sobre estrategias de apoyo y mejorar la situación académica del estudiante.</p>
        <br/>
        <p style="font-size: 0.9em; color: #666;">Atentamente,</p>
        <p style="font-size: 0.9em; color: #666; font-weight: bold;">Dirección Académica - Unidad Educativa La Paz "A"</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sistema Académico UELA" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `Alerta Urgente de Rendimiento - ${estudianteNombre}`,
      html: htmlContent
    });

    console.log(`Correo enviado a ${emailDestino} [ID: ${info.messageId}]`);
    return info;
  } catch (error) {
    console.error('Error enviando correo de alerta:', error);
    throw error;
  }
};

exports.enviarAlertaInasistencia = async (estudianteNombre, materia, faltas, limite, emailDestino) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlContent = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 10px;">Alerta de Inasistencia - Sistema UELA</h2>
        <p>Estimado/a Tutor/a,</p>
        <p>Le informamos que el estudiante ha superado el limite permitido de inasistencias en una materia.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Estudiante:</strong> ${estudianteNombre}</li>
            <li style="margin-bottom: 10px;"><strong>Materia:</strong> ${materia}</li>
            <li style="margin-bottom: 10px;"><strong>Faltas acumuladas:</strong> <span style="color: #e65100; font-weight: bold;">${faltas}</span></li>
            <li><strong>Limite permitido:</strong> ${limite}</li>
          </ul>
        </div>
        
        <p>Le sugerimos conversar con el estudiante y el docente para tomar las medidas necesarias.</p>
        <br/>
        <p style="font-size: 0.9em; color: #666;">Atentamente,</p>
        <p style="font-size: 0.9em; color: #666; font-weight: bold;">Dirección Académica - Unidad Educativa La Paz "A"</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sistema Académico UELA" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `Alerta de Inasistencia - ${estudianteNombre}`,
      html: htmlContent
    });

    console.log(`Correo de inasistencia enviado a ${emailDestino} [ID: ${info.messageId}]`);
    return info;
  } catch (error) {
    console.error('Error enviando correo de inasistencia:', error);
    throw error;
  }
};
