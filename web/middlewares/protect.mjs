// web/middleware/protect.mjs

import { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redisController from "../controllers/RedisController.mjs";

async function protect(req, res, next) {
  // 1. Verificación rápida de sesión local
  if (!req.session.user || !req.session.idToken) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user.id || req.session.user.user?.id;

    console.log("DEBUG - ID de usuario extraído:", userId); // <-- AÑADE ESTO

    const redisClient = await redisController.returnRedisClient();
    const cacheKey = `user:validation:${userId}`;

    // 2. INTENTO DE LECTURA DESDE REDIS (Caché de validación)
    const cachedValidation = await redisClient.get(cacheKey);

    let freshUser;

    if (cachedValidation) {
      // Si está en Redis, confiamos en esos datos y ahorramos la llamada a la API
      freshUser = JSON.parse(cachedValidation);
    } else {
      // 3. SI NO ESTÁ EN CACHÉ, LLAMADA A LA API
      const api = getAuthenticatedClient(req.session.idToken);

      // LÍNEA TEMPORAL PARA TEST: Descomentar para simular token expirado y comprobar si funciona la sesión de redis para regenerar el token
      // throw {
      //   response: { status: 401, data: { code: "auth/id-token-expired" } },
      // };

      const response = await api.get(`/users/me/${userId}`);

      // Normalizamos el objeto (quitamos el envoltorio {message, user})
      freshUser = response.data.user || response.data;

      // 4. GUARDAR EN REDIS (ej. 5 o 10 minutos)
      // Esto evita llamar a la API en cada clic, pero re-valida periódicamente
      await redisClient.setEx(cacheKey, 600, JSON.stringify(freshUser));
    }

    // 5. Validación de cuenta activa (Incluso con caché, esto se chequea)
    if (freshUser.deleted_at) {
      console.warn(
        `Intento de acceso de usuario desactivado: ${freshUser.email}`,
      );
      return destroySession(req, res, "Su cuenta ha sido desactivada.");
    }

    // 6. Sincronización de datos para la vista y siguiente middleware
    req.session.user = freshUser;
    res.locals.user = freshUser;
    res.locals.isAdmin = freshUser.role === "ADMIN";

    next();
  } catch (error) {
    // Detectamos si el error es porque el token de Firebase caducó
    const isExpired =
      error.response?.data?.code === "auth/id-token-expired" ||
      error.message?.includes("expired") ||
      error.response?.status === 401;

    if (isExpired && req.session.user) {
      console.warn(
        "⏰ Token expirado pero sesión Redis activa. Recuperando datos de sesión.",
      );

      // En lugar de echarlo, recuperamos los datos que ya tenemos en la sesión de Redis
      const fallbackUser = req.session.user.user || req.session.user;
      res.locals.user = fallbackUser;
      res.locals.isAdmin = fallbackUser?.role === "ADMIN";

      // Dejamos que pase. Tu script de frontend renovará el token en segundos.
      return next();
    }

    // Si el error no es por expiración (ej: 500 de la API), intentamos degradación graciosa
    console.error("Error crítico en protect:", error.message);
    if (req.session.user) {
      const fallbackUser = req.session.user.user || req.session.user;
      res.locals.user = fallbackUser;
      res.locals.isAdmin = fallbackUser?.role === "ADMIN";
      return next();
    }

    // Si todo falla y no hay ni usuario en sesión, al login
    return destroySession(req, res, "Sesión inválida o caducada.");
  }
}

// Función auxiliar para limpiar sesión y cookies
function destroySession(req, res, message) {
  return req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect(`/login?error=${encodeURIComponent(message)}`);
  });
}

// async function protect(req, res, next) {
//   if (req.session.user) {
//     console.log("Autenticado");
//     console.log(req.session.user);
//     res.locals.user = req.session.user;
//     res.locals.isAdmin = req.session.user.role === "ADMIN";
//     next();
//   } else {
//     console.log("No autenticado");
//     console.log(req.session.user);
//     req.session.returnTo = req.originalUrl;
//     res.redirect("/login");
//   }
// }

async function requireAdmin(req, res, next) {
  // Usamos res.locals que ya fue inyectado y validado por protect()
  if (res.locals.user && res.locals.isAdmin) {
    console.log("Acceso concedido: Admin");
    next();
  } else {
    console.log("Acceso denegado: No es administrador");
    res.status(403).render("errors/403");
  }
}

async function requireFreshToken(req, res, next) {
  const token = req.body?.firebase_token || req.headers["x-firebase-token"];

  console.log("Token en body: ", req.body);

  if (!token) {

    console.log("Token requerido en requireFreshToken");

    // Si es una petición de formulario, redirige con error
    if (req.accepts("html")) {
      req.session.flash = {
        type: "error",
        message: "Sesión de seguridad requerida. Por favor recarga la página.",
      };
      return res.redirect("back");
    }
    return res.status(401).json({ message: "Token de seguridad requerido" });
  }

  // Guardamos el token fresco en la sesión para usarlo en el controlador
  req.session.idToken = token;
  next();
}

export default { protect, requireAdmin, requireFreshToken };
