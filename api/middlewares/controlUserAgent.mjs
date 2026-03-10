import rateLimit from "express-rate-limit";

/**
 * CONFIGURACIÓN DE RATE LIMIT PARA API
 * En la API somos más estrictos (50 peticiones en lugar de 100)
 * para evitar el scraping masivo de la base de datos.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Límite reducido para proteger los datos (JSON)
  standardHeaders: true,
  legacyHeaders: false,
  // EXCEPCIÓN PARA TU TFG:
  // Si tu Servidor Web tiene una IP fija, puedes saltar el límite aquí
  skip: (req) => {
    // return req.ip === '127.0.0.1'; // Ejemplo para desarrollo local
    const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
    return trustedIPs.includes(req.ip);
  },
  message: {
    status: 429,
    error: "Too Many Requests",
    message:
      "Límite de consultas a la API excedido. Protección de datos activa.",
  },
});

/**
 * MIDDLEWARE DE FILTRADO DE IA (API VERSION)
 */
function filterIA(req, res, next) {
  const ua = req.useragent;

  if (!ua) return next();

  // Lista ampliada para la API (incluimos bots de recolección de datos)
  const aiKeywords =
    /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended|ccbot|imagesiftbot/i;

  if (ua.isBot || aiKeywords.test(ua.source)) {
    console.error(
      `[API SECURITY] Bloqueo de scraper/IA: ${ua.source} | IP: ${req.ip}`,
    );

    return res.status(403).json({
      status: 403,
      error: "Forbidden",
      message:
        "Acceso a la API denegado: Los agentes automatizados no tienen permiso para extraer datos.",
    });
  }

  next();
}

export default {
  apiLimiter,
  filterIA,
};
