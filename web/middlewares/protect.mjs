// web/middleware/protect.mjs
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
