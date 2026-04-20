// web/middleware/protect.mjs

import { getAuthenticatedClient } from "../utils/apiClient.mjs";

// async function protect(req, res, next) {
//   // 1. Verificación rápida: ¿Hay sesión?
//   if (!req.session.user) {
//     console.log("Acceso denegado: No hay sesión activa.");
//     req.session.returnTo = req.originalUrl;
//     return res.redirect("/login");
//   }

//   try {
//     // CORRECCIÓN: Buscamos el ID donde sea que esté (por si la sesión está sucia)
//     const userId = req.session.user.id || req.session.user.user?.id;

//     if (!userId) {
//       console.error("No se pudo encontrar el ID del usuario en la sesión.");
//       return res.redirect("/login");
//     }

//     const api = getAuthenticatedClient(req.session.idToken);
//     const response = await api.get(`/users/me/${userId}`);

//     // 2. Sincronización inteligente: Extraemos el usuario real del envoltorio de la API
//     // Tu API devuelve { message: "...", user: {...} }, así que tomamos solo el .user
//     const freshUser = response.data.user ? response.data.user : response.data;

//     // 3. Validación de cuenta activa
//     if (freshUser.deleted_at) {
//       console.log(`Usuario ${freshUser.email} inhabilitado.`);
//       return req.session.destroy(() => {
//         res.clearCookie("connect.sid");
//         res.redirect("/login?error=Su cuenta ha sido desactivada.");
//       });
//     }

//     // 4. Actualizamos Redis con el objeto PLANO (sin el "message")
//     req.session.user = freshUser;

//     // 5. Inyectar en res.locals para EJS
//     res.locals.user = freshUser;
//     res.locals.isAdmin = freshUser.role === "ADMIN";

//     console.log(`Usuario ${freshUser.email} autenticado y validado.`);
//     next();
//   } catch (error) {
//     console.error("Error en validación de sesión:", error.message);

//     if (error.response?.status === 401) {
//       return req.session.destroy(() => {
//         res.clearCookie("connect.sid");
//         res.redirect("/login?error=Su sesión ha caducado.");
//       });
//     }

//     // FALLBACK: Aseguramos que los datos antiguos también se limpien si estaban anidados
//     const sessionUser = req.session.user.user
//       ? req.session.user.user
//       : req.session.user;
//     res.locals.user = sessionUser;
//     res.locals.isAdmin = sessionUser?.role === "ADMIN";
//     next();
//   }
// }

async function protect(req, res, next) {
  if (req.session.user) {
    console.log("Autenticado");
    console.log(req.session.user);
    res.locals.user = req.session.user;
    res.locals.isAdmin = req.session.user.role === "ADMIN";
    next();
  } else {
    console.log("No autenticado");
    console.log(req.session.user);
    req.session.returnTo = req.originalUrl;
    res.redirect("/login");
  }
}

async function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "ADMIN") {
    console.log("Admin");
    next();
  } else {
    console.log("No admin");
    res.status(403).render("errors/403");
  }
}

async function requireFreshToken(req, res, next) {
  const token = req.body?.firebase_token || req.headers["x-firebase-token"];

  if (!token) {
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
