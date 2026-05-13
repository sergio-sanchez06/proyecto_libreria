import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const SENDER_NAME = "Bookly S.L.";
const SENDER_EMAIL = process.env.EMAIL_USER || "izanferlaf@gmail.com";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     type: "OAuth2",
//     user: "izanferlaf@gmail.com",
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     refreshToken: process.env.REFRESH_TOKEN,
//   },
// });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

// Esta configuración de correo no funciona. da error invalid_grant: Bad Request

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     type: "OAuth2",
//     user: SENDER_EMAIL,
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     refreshToken: process.env.REFRESH_TOKEN,
//   },
// });

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
      .map((item) => {
        // Optimizamos la imagen para que sea un poco más grande (80px ancho)
        const optimizedCover = item.cover_url.includes("cloudinary.com")
          ? item.cover_url.replace(
              "/upload/",
              "/upload/w_160,h_240,c_fill,q_auto,f_auto/",
            )
          : item.cover_url;

        return `
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #eee; width: 80px; vertical-align: top;">
            <img src="${optimizedCover}" 
                 alt="${item.title}" 
                 style="width: 80px; height: auto; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: block;">
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #eee; vertical-align: middle;">
            <strong style="font-size: 16px; color: #333; display: block; margin-bottom: 4px;">${item.title}</strong>
            <span style="font-size: 13px; color: #666;">Precio: ${parseFloat(item.price).toFixed(2)}€</span>
          </td>
          <td style="text-align: center; padding: 15px; border-bottom: 1px solid #eee; vertical-align: middle; font-size: 14px;">
            <strong>x${item.quantity}</strong>
          </td>
          <td style="text-align: right; padding: 15px; border-bottom: 1px solid #eee; vertical-align: middle; font-size: 15px; font-weight: bold; color: #007bff;">
            ${(item.price * item.quantity).toFixed(2)}€
          </td>
        </tr>
      `;
      })
      .join("");

    const content = `
    <h2 style="color: #28a745; margin-top: 0;">¡Pedido Confirmado! ✅</h2>
    <p>Hola <strong>${userName}</strong>, gracias por confiar en nosotros. Hemos recibido tu pedido y nos hemos puesto manos a la obra.</p>
    
    <div style="background: #f1f8f3; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 25px;">
      <strong style="color: #28a745; font-size: 14px; text-transform: uppercase;">Dirección de envío:</strong><br>
      <span style="font-size: 15px; color: #444;">${address}</span>
    </div>

    <table class="table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #eee;" colspan="2">Libro</th>
          <th style="text-align: center; padding-bottom: 10px; border-bottom: 2px solid #eee;">Cant.</th>
          <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right; padding-top: 25px; font-weight: bold; font-size: 16px;">Total Pagado:</td>
          <td style="text-align: right; padding-top: 25px; font-weight: bold; font-size: 22px; color: #007bff;">${displayTotal}€</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 13px; color: #999;">Si tienes alguna duda sobre tu compra, responde a este correo o contacta con soporte.</p>
    </div>
  `;

    return await this._send(
      toEmail,
      "Confirmación de tu pedido 📚",
      this._template(
        content,
        `¡Hola ${userName}! Tu pedido en Bookly ha sido confirmado.`,
      ),
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
      <h2 style="color: #dc3545; margin-top: 0;">Aviso de Seguridad ❌</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Te informamos que tu cuenta ha sido <strong>deshabilitada temporalmente</strong> por un administrador o por motivos de seguridad.</p>
      <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          Si crees que esto es un error o deseas solicitar una revisión para recuperar tu acceso, por favor ponte en contacto con nuestro equipo de soporte técnico.
        </p>
      </div>
      <div style="text-align: center; margin-top: 25px;">
        <a href="mailto:soporte@bookly.com" class="btn" style="background: #6c757d;">Contactar a Soporte</a>
      </div>
    `;
    return await this._send(
      toEmail,
      "Cuenta deshabilitada ❌",
      this._template(content),
    );
  },

  async sendOrderCancellationEmail(toEmail, userName, items, refunded) {
    const itemRows = items
      .map((item) => {
        const title = item.book?.title || "Libro";
        const cover_url = item.book?.cover_url || null;
        const price = Number(item.price_at_time || 0);

        const optimizedCover = cover_url?.includes("cloudinary.com")
          ? cover_url.replace(
              "/upload/",
              "/upload/w_160,h_240,c_fill,q_auto,f_auto/",
            )
          : cover_url || "URL_DE_TU_PLACEHOLDER";

        return `
      <tr>
        <td style="padding:15px;border-bottom:1px solid #eee;width:80px;vertical-align:top;">
          <img src="${optimizedCover}" alt="${title}"
               style="width:80px;height:auto;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,0.1);display:block;">
        </td>
        <td style="padding:15px;border-bottom:1px solid #eee;vertical-align:middle;">
          <strong style="font-size:16px;color:#333;display:block;margin-bottom:4px;">${title}</strong>
          <span style="font-size:13px;color:#666;">Precio: ${price.toFixed(2)}€</span>
        </td>
        <td style="text-align:center;padding:15px;border-bottom:1px solid #eee;vertical-align:middle;font-size:14px;">
          x${item.quantity}
        </td>
        <td style="text-align:right;padding:15px;border-bottom:1px solid #eee;vertical-align:middle;font-size:15px;font-weight:bold;color:#dc3545;">
          ${(price * item.quantity).toFixed(2)}€
        </td>
      </tr>`;
      })
      .join("");

    const refundNote = refunded
      ? `
        <div style="color: #2d6a4f; background: #d8f3dc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #b7e4c7;">
          <strong>ℹ️ Información de Reembolso:</strong><br>
          <span style="font-size: 14px;">El importe se procesará en <strong>5-10 días hábiles</strong> en tu método de pago original.</span>
        </div>
      `
      : "";

    const content = `
      <h2 style="color: #c0392b; margin-top: 0;">Pedido Cancelado ❌</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Te confirmamos que tu pedido ha sido cancelado correctamente. Lamentamos que no hayas podido completar tu compra en esta ocasión.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #eee;" colspan="2">Producto</th>
            <th style="text-align: center; padding-bottom: 10px; border-bottom: 2px solid #eee;">Cant.</th>
            <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #eee;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      ${refundNote}

      <p style="color: #718096; font-size: 13px; text-align: center; margin-top: 30px;">
        Si no solicitaste esta cancelación o crees que hay un error, por favor ponte en contacto con nosotros lo antes posible.
      </p>
    `;

    return await this._send(
      toEmail,
      "Confirmación de cancelación de pedido ❌",
      this._template(content, "Tu pedido en Bookly ha sido cancelado."),
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
