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
  res.render("login", { error: null });
}

// Procesa login (recibe idToken del cliente)
async function login(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    console.log("Token requerido");
    return res.render("login", { error: "Token requerido" });
  }

  try {
    // const response = await apiClient.post(
    //   "/auth/login",
    //   {},
    //   {
    //     headers: { Authorization: `Bearer ${idToken}` },
    //   }
    // );

    const response = await apiClient.post("/auth/login", { idToken });
    const { user } = response.data;

    // if (response.status !== 200) {
    //   return res.render("login", { error: "Token inválido" });
    // } else {
    //   console.log(response.data);
    // }

    // const { user } = response.data;

    // Crea sesión
    req.session.user = user;
    req.session.idToken = idToken;
    await req.session.save();

    res.redirect("/");
  } catch (error) {
    const message = error.response?.data?.message || "Error al iniciar sesión";
    res.render("login", { error: message });
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
  res.render("register", { error: null });
}

async function register(req, res) {
  const { idToken, name, email, default_address, optional_address } = req.body;

  // 1. Validación en el servidor (Requisito del PDF)
  if (!idToken || !name || !email || !default_address) {
    return res.render("register", {
      error: "Faltan campos obligatorios o el token de Firebase",
    });
  }

  console.log("Registrando usuario", req.body);

  try {
    // 2. Consumo indirecto: Enviamos los datos a nuestra API REST
    const response = await apiClient.post("/auth/register", {
      idToken,
      name,
      email,
      default_address,
      optional_address,
    });

    // 3. Si la API responde bien, el usuario ya está en nuestra DB local.
    // Creamos la sesión para que el usuario entre directamente.
    req.session.user = response.data.user;
    req.session.idToken = idToken;
    await req.session.save();

    res.redirect("/"); // Redirigimos al home
  } catch (error) {
    console.error("Error registro:", error.response?.data);
    res.render("register", {
      error:
        error.response?.data?.message ||
        "Error al crear la cuenta en la base de datos",
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
