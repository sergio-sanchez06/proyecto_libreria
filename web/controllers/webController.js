// servidor/web/controllers/webController.js (EXPANDIDO)

const libroModel = require("../models/libroModel");
const getDbPool = (req) => req.app.locals.db;

// --- MIDDLEWARES DE SEGURIDAD (Se mantienen) ---

/**
 * Middleware para asegurar que el usuario ha iniciado sesión
 */
exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  next();
};

/**
 * Middleware para verificar el rol del usuario
 */
exports.checkRole = (requiredRole) => (req, res, next) => {
  if (!req.session.user || req.session.user.rol !== requiredRole) {
    // Renderiza la vista error.ejs si el acceso es denegado
    return res.status(403).render("error", {
      pageTitle: "Acceso Denegado",
      user: req.session.user,
      message: `Acceso denegado. Rol requerido: ${requiredRole}.`,
    });
  }
  next();
};

// --- VISTAS PÚBLICAS (GETs) ---

/**
 * 1. Home / Inventario Principal
 */
exports.showAllLibros = async (req, res) => {
  const pool = getDbPool(req);
  const user = req.session.user;
  let libros = [];
  let error = null;

  try {
    libros = await libroModel.findAll(pool);
  } catch (dbError) {
    console.error("Error al obtener libros:", dbError.stack);
    error = "Error al cargar la base de datos de libros.";
  }

  res.render("index", {
    pageTitle: "Inventario de Tienda",
    libros,
    user,
    error,
  });
};

/**
 * 2. Formulario de Inicio de Sesión
 */
exports.showLoginForm = (req, res) => {
  res.render("login", {
    pageTitle: "Iniciar Sesión",
    error: null, // El error se añade desde el apiController en el POST
    user: req.session.user,
  });
};

/**
 * 3. Formulario de Registro
 */
exports.showRegisterForm = (req, res) => {
  res.render("register", {
    pageTitle: "Registrarse",
    error: null,
    user: req.session.user,
  });
};

// --- VISTAS PROTEGIDAS PARA USUARIOS (Requiere requireLogin) ---

/**
 * 4. Detalle del Libro
 * Aquí deberíamos cargar el detalle del libro, autor, y las reseñas
 */
exports.showLibroDetail = async (req, res) => {
  const pool = getDbPool(req);
  const { id } = req.params;

  try {
    const libro = await libroModel.findById(pool, id);

    if (!libro) {
      return res.status(404).render("error", {
        pageTitle: "Libro no encontrado",
        message: "El libro que buscas no existe.",
        user: req.session.user,
      });
    }

    res.render("libro_detalle", {
      pageTitle: libro.titulo,
      libro: libro,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al cargar detalle del libro:", error);
    res.status(500).render("error", {
      pageTitle: "Error",
      message: "Error al cargar la información del libro.",
      user: req.session.user,
    });
  }
};

/**
 * 5. Perfil de Usuario
 */
exports.showUserProfile = (req, res) => {
  // NOTA: Aquí se cargaría la información del usuario y su dirección.
  res.render("perfil", {
    pageTitle: "Mi Perfil",
    user: req.session.user,
    // userDetails: (datos cargados de la DB)...
    error: null,
  });
};

/**
 * 6. Historial de Compras
 */
exports.showSalesHistory = (req, res) => {
  // NOTA: Aquí se cargaría el historial de ventas usando ventaModel.getSalesHistoryByUserId
  res.render("historial_compras", {
    pageTitle: "Historial de Compras",
    user: req.session.user,
    // sales: (historial cargado de la DB)...
    error: null,
  });
};

/**
 * 7. Panel de Administración
 */
exports.showAdminPanel = (req, res) => {
  res.render("admin/dashboard", {
    pageTitle: "Panel de Administración",
    user: req.session.user,
  });
};

/**
 * 8. Formulario CRUD de Libros
 */
exports.showLibroForm = (req, res) => {
  // Se usará para crear o editar (si tiene req.params.id)
  res.render("admin/libro_form", {
    pageTitle: "CRUD Libros",
    user: req.session.user,
    libro: null, // Datos del libro a editar, o null si es nuevo
    error: null,
  });
};
