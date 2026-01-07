// web/controllers/authController.mjs
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Muestra formulario
async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("partials/login", { error: null, user: null });
}

// Procesa login (recibe idToken del cliente)
async function login(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    console.log("Token requerido");
    return res.render("partials/login", { error: "Token requerido" });
  }

  try {

    const response = await apiClient.post("/auth/login", { idToken });
    const { user } = response.data;


    // Crea sesión
    req.session.user = user;
    req.session.idToken = idToken;
    await req.session.save();

    res.redirect("/");
  } catch (error) {
    const message = error.response?.data?.message || "Error al iniciar sesión";
    res.render("partials/login", { error: message });
  }
}

// Logout
async function logout(req, res) {
  req.session.destroy();
  // req.session.idToken = null;
  res.redirect("/login");
}

// Middleware para proteger rutas
async function protect(req, res, next) {
  if (req.session.user) {
    res.locals.user = req.session.user; // para usar en vistas
    next();
  } else {
    res.redirect("/login");
  }
}

async function showRegister(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("partials/register", { error: null, formData: null, user: null });
}

async function register(req, res) {
  const { name, email, password, default_address, optional_address } = req.body;

  if (!name || !email || !password || !default_address) {
    return res.render("register", {
      error: "Faltan campos obligatorios",
      formData: {
        name,
        email,
        default_address,
        optional_address,
      },
    });
  }

  try {
    // 2. Consumo indirecto: Enviamos los datos a nuestra API REST
    const response = await apiClient.post("/users/register", {
      name,
      email,
      password,
      default_address,
      optional_address,
    });

    res.redirect("/login"); // Redirigimos al login para el inicio de sesión
  } catch (error) {
    if (!error.response) {
      console.error("Error de conexión: La API no responde");
    } else {
      console.error("Error de la API:", error.response.data);
    }
    res.render("register", {
      error:
        error.response?.data?.message || "Error de conexión con el servidor",
      formData: req.body,
    });
  }
}

export default {
  showLogin,
  login,
  logout,
  protect,
  register,
  showRegister,
};
