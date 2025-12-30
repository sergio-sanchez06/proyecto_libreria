// web/controllers/webController.mjs
// Controlador principal para las vistas del servidor WEB

const API_BASE_URL = "http://localhost:3000";

// ==========================================
// HELPER: Fetch a la API
// ==========================================
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Si es 204 No Content, no esperar JSON
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================

/**
 * Middleware para asegurar que el usuario ha iniciado sesión.
 */
export const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  next();
};

/**
 * Middleware para verificar el rol del usuario
 */
export const checkRole = (requiredRole) => (req, res, next) => {
  if (!req.session.user || req.session.user.rol !== requiredRole) {
    return res.status(403).render("error", {
      pageTitle: "Acceso Denegado",
      user: req.session.user,
      message: `Acceso denegado. Rol requerido: ${requiredRole}.`,
    });
  }
  next();
};

// ==========================================
// VISTAS PÚBLICAS (GETs)
// ==========================================

/**
 * 1. Home / Inventario Principal
 * Muestra todos los libros del catálogo
 */
export const showAllLibros = async (req, res) => {
  const user = req.session.user;
  let libros = [];
  let error = null;

  try {
    // Llamada a la API para obtener todos los libros
    const librosAPI = await fetchAPI("/books");

    // Mapear los campos de la API a los que espera la vista index.ejs
    libros = librosAPI.map((libro) => ({
      id: libro.id,
      titulo: libro.title,
      autor: libro.author_name || "Desconocido", // Si la API lo proporciona
      anio_publicacion: libro.releashed_year,
      isbn: libro.isbn,
      precio: libro.price,
      portada: libro.cover_url,
      sinopsis: libro.synopsis,
      copias_disponibles: libro.stock,
      cantidad_total: libro.stock, // Asumiendo que stock es el total
      fecha_creacion: libro.created_at
        ? new Date(libro.created_at)
        : new Date(),
      formato: libro.format,
      idioma: libro.language,
      paginas: libro.pages,
    }));
  } catch (apiError) {
    console.error("Error al obtener libros desde la API:", apiError);
    error = "Error al cargar el catálogo de libros.";
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
export const showLoginForm = (req, res) => {
  res.render("login", {
    pageTitle: "Iniciar Sesión",
    error: null,
    user: req.session.user,
  });
};

/**
 * 3. Formulario de Registro
 */
export const showRegisterForm = (req, res) => {
  res.render("register", {
    pageTitle: "Registrarse",
    error: null,
    user: req.session.user,
  });
};

// ==========================================
// VISTAS PROTEGIDAS PARA USUARIOS
// ==========================================

/**
 * 4. Detalle del Libro
 * Muestra información completa de un libro específico
 */
export const showLibroDetail = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el libro desde la API
    const libro = await fetchAPI(`/books/${id}`);

    if (!libro) {
      return res.status(404).render("error", {
        pageTitle: "Libro no encontrado",
        message: "El libro que buscas no existe.",
        user: req.session.user,
      });
    }

    // Mapear los campos de la API a los que espera la vista
    const libroMapeado = {
      id: libro.id,
      titulo: libro.title,
      isbn: libro.isbn,
      precio: libro.price,
      portada: libro.cover_url,
      sinopsis: libro.synopsis,
      anio_publicacion: libro.releashed_year,
      formato: libro.format,
      idioma: libro.language,
      paginas: libro.pages,
      copias_disponibles: libro.stock,
      // Campos adicionales que la vista podría necesitar
      autor: libro.author_name || "Desconocido", // Si la API lo proporciona
      generos: libro.genres || [], // Si la API lo proporciona
    };

    res.render("libro_detalle", {
      pageTitle: libroMapeado.titulo,
      libro: libroMapeado,
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
export const showUserProfile = async (req, res) => {
  try {
    // Obtener información del usuario desde la API
    const userId = req.session.user.id;
    const userDetails = await fetchAPI(`/users/${userId}`);

    res.render("perfil", {
      pageTitle: "Mi Perfil",
      user: req.session.user,
      userDetails,
      error: null,
    });
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    res.render("perfil", {
      pageTitle: "Mi Perfil",
      user: req.session.user,
      userDetails: null,
      error: "Error al cargar los datos del perfil.",
    });
  }
};

/**
 * 6. Historial de Compras
 */
export const showSalesHistory = async (req, res) => {
  try {
    // Obtener el historial de pedidos del usuario
    const userId = req.session.user.id;
    const orders = await fetchAPI(`/orders/user/${userId}`);

    res.render("historial_compras", {
      pageTitle: "Historial de Compras",
      user: req.session.user,
      orders,
      error: null,
    });
  } catch (error) {
    console.error("Error al cargar historial:", error);
    res.render("historial_compras", {
      pageTitle: "Historial de Compras",
      user: req.session.user,
      orders: [],
      error: "Error al cargar el historial de compras.",
    });
  }
};

/**
 * 7. Panel de Administración
 */
export const showAdminPanel = (req, res) => {
  res.render("admin/dashboard", {
    pageTitle: "Panel de Administración",
    user: req.session.user,
  });
};

/**
 * 8. Formulario CRUD de Libros
 */
export const showLibroForm = async (req, res) => {
  const { id } = req.params;
  let libro = null;

  // Si hay ID, estamos editando
  if (id) {
    try {
      libro = await fetchAPI(`/books/${id}`);
    } catch (error) {
      console.error("Error al cargar libro para editar:", error);
    }
  }

  res.render("admin/libro_form", {
    pageTitle: id ? "Editar Libro" : "Nuevo Libro",
    user: req.session.user,
    libro,
    error: null,
  });
};

// ==========================================
// EXPORTAR TODO JUNTO (Para compatibilidad)
// ==========================================
export default {
  requireLogin,
  checkRole,
  showAllLibros,
  showLoginForm,
  showRegisterForm,
  showLibroDetail,
  showUserProfile,
  showSalesHistory,
  showAdminPanel,
  showLibroForm,
};
