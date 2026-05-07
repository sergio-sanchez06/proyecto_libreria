import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisController from "../controllers/RedisController.mjs";

let redisClient = await redisController.returnRedisClient();

/**
 * CONFIGURACIÓN DE RATE LIMIT
 * Se define como una constante que ejecuta la función rateLimit()
 * para que la instancia se cree al inicializar la aplicación.
 */

const apiLimiter = rateLimit({
  store: new RedisStore({
    // En lugar de sendCommand manual, simplemente pasa el cliente directamente
    // O usa la sintaxis de ejecución de comandos simplificada:
    sendCommand: (...args) => redisClient.sendCommand(args.flat()),
    prefix: "rl:",
  }),

  windowMs: 1 * 60 * 1000,
  max: (req) => {
    if (req.session?.user?.role === "ADMIN") return 1000;
    if (req.session?.user) return 500; // Usuario logueado (Cliente)
    return 200; // Usuario anónimo (Navegando por la tienda)
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  // keyGenerator explícito: garantiza que la IP extraída sea la real del cliente
  // cuando hay un proxy inverso (nginx, Caddy, etc.) delante del servidor Express.
  // Sin esto, todos los usuarios comparten el límite de la IP del proxy (127.0.0.1).
  keyGenerator: (req) => {
    // En Railway, X-Forwarded-For puede tener múltiples IPs: "clienteIP, proxy1, proxy2"
    // La primera es siempre la IP real del cliente
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const clientIP = forwarded.split(",")[0].trim();
      if (clientIP) return clientIP;
    }
    return req.ip || "unknown";
  },
  skip: (req) => {
    // Excluir assets estáticos del conteo — no tienen sentido en el rate limit
    // y en Railway generan mucho tráfico interno innecesario
    const staticExts =
      /\.(css|js|mjs|ico|png|jpg|jpeg|webp|svg|woff2?|map|json)$/i;
    if (staticExts.test(req.path)) return true;

    // 2. Rutas de sistema que NO deben contar para el límite
    // Incluimos /auth/refresh-token para que Firebase no de error 401/429
    const systemRoutes = ["/auth/refresh-token", "/language", "/favicon.ico"];
    if (systemRoutes.includes(req.path)) return true;

    // En desarrollo, las IPs de loopback no se limitan
    if (process.env.NODE_ENV !== "production") {
      const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
      return trustedIPs.includes(req.ip);
    }

    return false;
  },
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "Límite de peticiones excedido. Inténtalo de nuevo más tarde.",
  },
  handler: (req, res, next, options) => {
    // Si es una petición de API/Fetch, respondemos con JSON
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(options.statusCode).json(options.message);
    }

    // Para el navegador, pasamos las variables que el header.ejs necesita
    res.status(options.statusCode).render("errors/429", {
      title: "429 - Límite excedido",
      // Variables críticas para que header.ejs no rompa:
      currentUrl: req.originalUrl || "/",
      i18n: req.i18n,
      t: req.t,
      user: req.session?.user || null,
    });
  },
});

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: (req) => {
//     if (req.session?.user?.role === "ADMIN") return 1000;
//     return 100;
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // Solo saltar en desarrollo
//     if (process.env.NODE_ENV === "production") return false;
//     const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
//     return trustedIPs.includes(req.ip);
//   },
//   message: {
//     status: 429,
//     error: "Too Many Requests",
//     message: "Límite de peticiones excedido. Inténtalo de nuevo más tarde.",
//   },
// });

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: (req, res) => {
//     // Si el usuario está logueado y es ADMIN, le damos manga ancha (ej. 1000 peticiones)
//     if (req.session && req.session?.user?.role === "ADMIN") {
//       return 100;
//     }
//     // Para el resto de usuarios o anónimos, el límite estándar
//     return 100;
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // return req.ip === '127.0.0.1'; // Ejemplo para desarrollo local
//     const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
//     return trustedIPs.includes(req.ip);
//   },
//   message: {
//     status: 429,
//     error: "Too Many Requests",
//     message: "Límite de peticiones excedido. Inténtalo de nuevo más tarde.",
//   },
// });

/**
 * MIDDLEWARE DE FILTRADO DE IA — WEB
 *
 * Dos niveles de detección:
 *  1. express-useragent marca isBot=true para crawlers genéricos
 *  2. AI_BOT_PATTERN cubre scrapers de IA, bots de datos y clientes HTTP genéricos
 *
 * EXCEPCIÓN: /robots.txt siempre se sirve para que los bots bien educados
 * puedan leer las directivas Disallow antes de ser bloqueados.
 */

const AI_BOT_PATTERN =
  /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended|ccbot|imagesiftbot|anthropic-ai|cohere-ai|omgili|diffbot|semrushbot|ahrefsbot|bytespider|baiduspider|oai-searchbot|meta-externalagent|amazonbot|petalbot|duckassistbot|ia_archiver|python-requests|python-httpx|go-http-client|wget|libwww-perl/i;

function filterIA(req, res, next) {
  // Dejar pasar robots.txt siempre: los bots que respetan Disallow no deben ser bloqueados
  // antes de tener la oportunidad de leer las reglas
  if (req.path === "/robots.txt") return next();

  const ua = req.useragent;
  if (!ua) return next();

  if (ua.isBot || AI_BOT_PATTERN.test(ua.source)) {
    console.warn(`[SECURITY ALERT] IA Bloqueada: ${ua.source} | IP: ${req.ip}`);
    return res.status(403).render("errors/403", {
      title: "403 - Prohibido",
      currentURL: req.originalUrl,
      user: req.session?.user || null,
      message: "El acceso automatizado a la librería está restringido.",
    });
  }

  next();
}

// const AI_BOT_PATTERN =
//   /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended|ccbot|imagesiftbot|anthropic-ai|cohere-ai|omgili|youbot|diffbot|semrushbot|ahrefsbot/i;

// function filterIA(req, res, next) {
//   const ua = req.useragent;

//   // Si por alguna razón el middleware de useragent no cargó en app.mjs
//   if (!ua) {
//     return next();
//   }

//   if (ua.isBot || AI_BOT_PATTERN.test(ua.source)) {
//     console.warn(`[SECURITY ALERT] IA Bloqueada: ${ua.source} | IP: ${req.ip}`);

//     return res.status(403).render("errors/403", {
//       title: "403 - Prohibido",
//       user: req.session?.user || null,
//       message:
//         "El acceso automatizado a la librería está restringido (Controlador Web).",
//     });
//   }

//   next();
// }

export default {
  apiLimiter,
  filterIA,
};
