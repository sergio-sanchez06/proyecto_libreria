import rateLimit from "express-rate-limit";

/**
 * CONFIGURACIÓN DE RATE LIMIT
 * Se define como una constante que ejecuta la función rateLimit()
 * para que la instancia se cree al inicializar la aplicación.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req, res) => {
    // Si el usuario está logueado y es ADMIN, le damos manga ancha (ej. 1000 peticiones)
    if (req.session && req.session?.user?.role === "ADMIN") {
      return 1000;
    }
    // Para el resto de usuarios o anónimos, el límite estándar
    return 100;
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // return req.ip === '127.0.0.1'; // Ejemplo para desarrollo local
    const trustedIPs = ["::1", "127.0.0.1", "::ffff:127.0.0.1"];
    return trustedIPs.includes(req.ip);
  },
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "Límite de peticiones excedido. Inténtalo de nuevo más tarde.",
  },
});

/**
 * MIDDLEWARE DE FILTRADO DE AGENTES
 */
function filterIA(req, res, next) {
  const ua = req.useragent;

  // Si por alguna razón el middleware de useragent no cargó en app.mjs
  if (!ua) {
    return next();
  }

  const aiKeywords =
    /gptbot|chatgpt-user|claudebot|perplexitybot|applebot-extended/i;

  if (ua.isBot || aiKeywords.test(ua.source)) {
    console.warn(`[SECURITY ALERT] IA Bloqueada: ${ua.source} | IP: ${req.ip}`);

    return res.status(403).json({
      status: 403,
      error: "Forbidden",
      message: "El acceso automatizado a la librería está restringido.",
    });
  }

  next();
}

export default {
  apiLimiter,
  filterIA,
};
