import rateLimit from "express-rate-limit";
/**
 * CONFIGURACIÓN DE RATE LIMIT PARA API
 * En la API somos más estrictos (50 peticiones en lugar de 100)
 * para evitar el scraping masivo de la base de datos.
 */

const apiLimiter = (req, res, next) => {
  // if (process.env.NODE_ENV !== "production") return next();

  const tokenIdentidad = req.headers["x-internal-token"];

  console.log("Token recibido en API:", tokenIdentidad);

  if (tokenIdentidad === process.env.SESSION_SECRET) {
    return next(); // Es tu web, adelante.
  }

  // Si alguien intenta entrar desde fuera por la URL pública de Railway:
  console.warn(`Intento de acceso no autorizado desde IP: ${req.ip}`);
  return res
    .status(403)
    .json({ error: "Acceso restringido a servicios internos." });
};

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: (req) => {
//     // La API no tiene sesión propia, pero el header X-Internal-Token identifica
//     // las peticiones del servidor web, que ya tienen su propio rate limit
//     if (req.headers["x-internal-token"]) return 1000;
//     return 100;
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   // keyGenerator explícito para evitar que express-rate-limit use req.ip
//   // y falle silenciosamente cuando hay un proxy inverso (nginx, etc.)
//   // En producción, app.set("trust proxy", 1) hace que req.ip sea la IP real del cliente.
//   keyGenerator: (req) => {
//     const forwarded = req.headers["x-forwarded-for"];
//     if (forwarded) {
//       const clientIP = forwarded.split(",")[0].trim();
//       if (clientIP) return clientIP;
//     }
//     return req.ip || "unknown";
//   },
//   skip: (req) => {
//     if (process.env.NODE_ENV === "production") {
//       // Permitir peticiones del propio servidor web en producción sin contar límite
//       const webServerIP = process.env.WEB_SERVER_IP;
//       if (webServerIP && req.ip === webServerIP) return true;
//       return false;
//     }
//     // En desarrollo, las IPs de loopback nunca se limitan
//     const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
//     return trustedIPs.includes(req.ip);
//   },
//   message: {
//     status: 429,
//     error: "Too Many Requests",
//     message:
//       "Límite de consultas a la API excedido. Protección de datos activa.",
//   },
// });

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 50, // Límite reducido para proteger los datos (JSON)
//   standardHeaders: true,
//   legacyHeaders: false,
//   // EXCEPCIÓN PARA TU TFG:
//   // Si tu Servidor Web tiene una IP fija, puedes saltar el límite aquí
//   skip: (req) => {
//     if (process.env.NODE_ENV === "production") return false;

//     // return req.ip === '127.0.0.1'; // Ejemplo para desarrollo local
//     const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
//     return trustedIPs.includes(req.ip);
//   },
//   message: {
//     status: 429,
//     error: "Too Many Requests",
//     message:
//       "Límite de consultas a la API excedido. Protección de datos activa.",
//   },
// });

/**
 * MIDDLEWARE DE FILTRADO DE IA — API
 *
 * Dos niveles de detección:
 *  1. express-useragent marca isBot=true para crawlers genéricos (Googlebot, Bingbot, etc.)
 *  2. AI_BOT_PATTERN cubre scrapers de IA y bots de recolección de datos conocidos
 *
 * BYPASS: las peticiones del propio servidor web incluyen el header
 * X-Internal-Token para no bloquearse a sí mismas.
 */

const AI_BOT_PATTERN =
  /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended|ccbot|imagesiftbot|anthropic-ai|cohere-ai|omgili|diffbot|semrushbot|ahrefsbot|bytespider|baiduspider|oai-searchbot|meta-externalagent|amazonbot|petalbot|duckassistbot|ia_archiver|python-requests|python-httpx|go-http-client|wget|libwww-perl/i;

function filterIA(req, res, next) {
  // Bypass: peticiones internas del servidor web identificadas por token secreto
  const internalToken =
    process.env.SESSION_SECRET ||
    process.env.INTERNAL_API_TOKEN ||
    "bookly-internal";
  if (req.headers["x-internal-token"] === internalToken) return next();

  const ua = req.useragent;
  if (!ua) return next();

  if (ua.isBot || AI_BOT_PATTERN.test(ua.source)) {
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

// const AI_BOT_PATTERN =
//   /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended|ccbot|imagesiftbot|anthropic-ai|cohere-ai|omgili|youbot|diffbot|semrushbot|ahrefsbot/i;

// function filterIA(req, res, next) {
//   const ua = req.useragent;

//   if (!ua) return next();

//   // Lista ampliada para la API (incluimos bots de recolección de datos)

//   if (ua.isBot || AI_BOT_PATTERN.test(ua.source)) {
//     console.error(
//       `[API SECURITY] Bloqueo de scraper/IA: ${ua.source} | IP: ${req.ip}`,
//     );

//     return res.status(403).json({
//       status: 403,
//       error: "Forbidden",
//       message:
//         "Acceso a la API denegado: Los agentes automatizados no tienen permiso para extraer datos.",
//     });
//   }

//   next();
// }

export default {
  apiLimiter,
  filterIA,
};
