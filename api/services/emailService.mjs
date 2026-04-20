import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // No falla aunque el certificado sea auto-firmado o la cadena esté incompleta
    rejectUnauthorized: false,
  },
});

const emailService = {
  /**
   * Envía un correo de bienvenida tras un registro exitoso
   */
  async sendWelcomeEmail(toEmail, userName) {
    const subject = "¡Bienvenido/a a nuestra plataforma! 🚀";
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h1 style="color: #007bff;">¡Hola, ${userName}!</h1>
        <p>Su cuenta ha sido creada correctamente. Estamos encantados de tenerle con nosotros.</p>
        <p>Ya puede acceder a todos nuestros servicios desde su panel de usuario.</p>
        <br>
        <a href="${process.env.FRONTEND_URL}/login" 
           style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
           Iniciar Sesión
        </a>
      </div>
    `;
    return await this._send(toEmail, subject, html);
  },

  /**
   * Envía un correo notificando la reactivación de una cuenta
   */
  async sendReactivationEmail(toEmail, userName) {
    const subject = "Su cuenta ha sido reactivada 🎉";
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #28a745;">¡Buenas noticias, ${userName}!</h2>
        <p>Un administrador ha reactivado su cuenta. Ya puede volver a disfrutar de todas las funcionalidades de la plataforma.</p>
        <p>Sus datos y configuraciones se han mantenido intactos.</p>
        <br>
        <p>Si tiene cualquier duda o no ha solicitado esto, póngase en contacto con nosotros.</p>
      </div>
    `;
    return await this._send(toEmail, subject, html);
  },

  async sendDisableAccountEmail(toEmail, userName) {
    const subject = "Su cuenta ha sido deshabilitada ❌";
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #dc3545;">¡Lo sentimos, ${userName}!</h2>
        <p>Su cuenta ha sido deshabilitada. Ya no puede iniciar sesión en la plataforma.</p>
        <p>Si tiene cualquier duda o no ha solicitado esto, póngase en contacto con nosotros.</p>
      </div>
    `;
    return await this._send(toEmail, subject, html);
  },

  async sendDeletedAccountEmail(toEmail, userName) {
    const subject = "Su cuenta ha sido eliminada ❌";
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #dc3545;">¡Lo sentimos, ${userName}!</h2>
        <p>Su cuenta ha sido eliminada permanentemente. Ya no puede iniciar sesión en la plataforma.</p>
        <p>Si tiene cualquier duda o no ha solicitado esto, póngase en contacto con nosotros.</p>
      </div>
    `;
    return await this._send(toEmail, subject, html);
  },

  /**
   * Método interno para procesar el envío de correos
   * @private
   */
  async _send(to, subject, html) {
    try {
      const mailOptions = {
        from: `"Tu App Nombre" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Enviado a ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("[EmailService] Error crítico:", error.message);
      // En producción es mejor no lanzar el error para no romper el flujo del usuario
      // pero sí dejar rastro en los logs.
      return null;
    }
  },
};

export default emailService;
