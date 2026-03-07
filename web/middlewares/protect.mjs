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

export default { protect, requireAdmin };
