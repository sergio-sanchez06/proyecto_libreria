import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SENDER_NAME = "Bookly S.L.";
const SENDER_EMAIL = process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

const emailService = {
  /**
   * Layout Base para todos los correos
   * @private
   */
  _template(content, preheader = "") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 40px 0; }
          .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: #007bff; padding: 30px; text-align: center; color: white; }
          .content { padding: 40px; line-height: 1.6; color: #444; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eeeeee; }
          .btn { background: #007bff; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-top: 20px; }
          .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { border-bottom: 2px solid #eee; padding: 12px; text-align: left; font-size: 14px; }
          .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="body">
          <span style="display:none;font-size:1px;color:#fff;">${preheader}</span>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 24px;">Bookly</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Bookly S.L. - La mejor lectura a un clic.<br>
              Este es un correo automático, por favor no respondas directamente.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  async sendWelcomeEmail(toEmail, userName) {
    const loginUrl = `${FRONTEND_URL.replace(/\/$/, "")}/login`;
    const content = `
      <h2 style="color: #007bff; margin-top: 0;">¡Bienvenido/a, ${userName}! 👋</h2>
      <p>Estamos emocionados de tenerte en nuestra comunidad de lectores. Tu cuenta ha sido creada con éxito.</p>
      <p>A partir de ahora podrás explorar nuestro catálogo, gestionar tus pedidos y recibir recomendaciones personalizadas.</p>
      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn">Explorar Catálogo</a>
      </div>
    `;
    return await this._send(
      toEmail,
      "¡Bienvenido/a a Bookly! 🚀",
      this._template(content, "Tu aventura literaria comienza aquí."),
    );
  },

  async sendOrderConfirmationEmail(
    toEmail,
    userName,
    address,
    items,
    orderTotal,
  ) {
    // 1. SOLUCIÓN AL ERROR: Calculamos el total solo si no viene 'orderTotal'
    //    Usamos un nombre distinto (displayTotal) para que no choque con los parámetros
    const displayTotal = orderTotal
      ? parseFloat(orderTotal).toFixed(2)
      : items
          .reduce((acc, item) => acc + item.price * item.quantity, 0)
          .toFixed(2);

    // 2. Generamos el HTML de los items
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td><strong>${item.title}</strong></td>
        <td style="text-align: center;">x${item.quantity}</td>
        <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)}€</td>
      </tr>
    `,
      )
      .join("");

    const content = `
      <h2 style="color: #28a745; margin-top: 0;">¡Pedido Confirmado! ✅</h2>
      <p>Hola ${userName}, gracias por confiar en nosotros. Hemos recibido tu pedido y nos hemos puesto manos a la obra.</p>
      
      <div style="background: #f1f8f3; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
        <strong style="color: #28a745;">Dirección de envío:</strong><br>
        <span style="font-size: 14px;">${address}</span>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="text-align: left;">Producto</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="text-align: right; padding-top: 20px; font-weight: bold;">Total Pagado:</td>
            <td style="text-align: right; padding-top: 20px; font-weight: bold; font-size: 18px; color: #007bff;">${displayTotal}€</td>
          </tr>
        </tfoot>
      </table>
    `;

    return await this._send(
      toEmail,
      "Confirmación de tu pedido 📚",
      this._template(content, "Detalles de tu compra en Bookly."),
    );
  },

  async sendReactivationEmail(toEmail, userName) {
    const content = `
      <h2 style="color: #28a745;">¡Cuenta Reactivada! 🎉</h2>
      <p>Hola <strong>${userName}</strong>, un administrador ha reactivado tu acceso a la plataforma.</p>
      <p>Ya puedes volver a iniciar sesión y disfrutar de todas las ventajas de Bookly.</p>
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="btn">Ir a mi cuenta</a>
      </div>
    `;
    return await this._send(
      toEmail,
      "Tu cuenta vuelve a estar activa 🎉",
      this._template(content),
    );
  },

  async sendDisableAccountEmail(toEmail, userName) {
    const content = `
      <h2 style="color: #dc3545;">Aviso de Seguridad ❌</h2>
      <p>Hola ${userName}, te informamos que tu cuenta ha sido <strong>deshabilitada temporalmente</strong>.</p>
      <p>Si crees que esto es un error o deseas solicitar una revisión, ponte en contacto con nuestro equipo de soporte.</p>
    `;
    return await this._send(
      toEmail,
      "Cuenta deshabilitada ❌",
      this._template(content),
    );
  },

  async _send(to, subject, html) {
    try {
      const mailOptions = {
        from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
        to,
        subject,
        html,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Enviado a ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("[EmailService] Error:", error.message);
      return null;
    }
  },
};

export default emailService;
