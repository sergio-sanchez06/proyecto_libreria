// web/controllers/AuthController.mjs
// import axios from "axios";
import apiClient from "../utils/apiClient.mjs";

// const apiClient = axios.create({
//   baseURL: "http://localhost:3000",
//   withCredentials: true,
// });

// Muestra formulario
async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }

  const errorMsg = req.query.error || null;

  res.render("partials/login", {
    error: errorMsg,
    user: null,
    success: req.query.success || null,
  });
}

// Procesa login (recibe idToken del cliente)
// async function login(req, res) {
//   const { idToken } = req.body;

//   if (!idToken) {
//     return res.render("partials/login", {
//       error: "Token requerido",
//       user: null,
//     });
//   }

//   try {
//     const response = await apiClient.post("/auth/login", { idToken });
//     const { user, isNewUser } = response.data;

//     console.log("Nuevo usuario: ", isNewUser);

//     req.session.user = user;
//     req.session.idToken = idToken;

//     // Usar callback en lugar de await — evita el error no capturado en el primer login
//     req.session.save((err) => {
//       if (err) {
//         console.error("Error al guardar sesión:", err);
//         return res.render("partials/login", {
//           error: "Error al guardar la sesión, inténtalo de nuevo.",
//           user: null,
//         });
//       }
//       // 3. Lógica de redirección inteligente
//       if (isNewUser) {
//         // Si es nuevo, lo enviamos al formulario de dirección
//         // Asegúrate de tener esta ruta creada en tu router web
//         res.render("partials/edit-profile", {
//           user: req.session.user,
//           showWelcomeModal: true, // Esta bandera activa el JS del modal
//           message: "¡Bienvenido a bordo!",
//         });
//       } else {
//         // Si ya existía, al home como siempre
//         res.redirect("/");
//       }
//     });
//   } catch (error) {
//     const message = error.response?.data?.message || "Error al iniciar sesión";
//     res.render("partials/login", { error: message, user: null });
//   }
// }
async function login(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.render("partials/login", {
      error: "Token requerido",
      user: null,
    });
  }

  try {
    const response = await apiClient.post("/auth/login", { idToken });

    console.log("Respuesta del login: ", response.data.user.id);

    const { user } = response.data;

    if (!user || !user.id) {
      throw new Error("La API no encontró el usuario");
    }

    req.session.user = user;
    req.session.idToken = idToken; // Evitamos almacenar la sesión de cara a controlar nosotros la duración de las sesiones

    console.log("Usuario en sesión: ", req.session.user);
    console.log("Id del usuario en sesión: ", req.session.user.id);
    console.log("Token en sesión: ", req.session.idToken);

    // 1. Recuperamos la URL guardada por el middleware (o vamos a / si no hay ninguna)
    const redirectUrl = req.session.returnTo || "/";

    // 2. Limpiamos la variable para que no afecte a futuros logins
    delete req.session.returnTo;

    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        return res.render("partials/login", {
          error: "Error al guardar la sesión, inténtalo de nuevo.",
          user: null,
        });
      }
      // res.redirect("/");

      res.redirect(redirectUrl);
    });
  } catch (error) {
    const message = error.response?.data?.message || "Error al iniciar sesión";
    res.render("partials/login", { error: message, user: null });
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
    res.render("partials/register", {
      error:
        error.response?.data?.message || "Error de conexión con el servidor",
      formData: req.body,
      user: null,
    });
  }
}

async function socialLogin(req, res) {
  const { idToken } = req.body;

  try {
    // 1. Enviamos el token a la API para validar/crear usuario
    const apiResponse = await apiClient.post("/auth/social-login", {
      idToken,
    });

    // IMPORTANTE: Extraemos también isNewUser de la respuesta de la API
    const { user, isNewUser } = apiResponse.data;

    console.log("¿Es login social de nuevo usuario?:", isNewUser);

    // 2. CREAR SESIÓN: Guardamos al usuario en la sesión de la web
    req.session.user = user;
    req.session.idToken = idToken;

    console.log(req.session.user);

    // 3. Guardado de sesión y redirección/renderizado
    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        return res.redirect("/login?error=session_error");
      }

      if (isNewUser) {
        // Si es nuevo, mostramos la vista de completar perfil con el modal activo
        return res.render("partials/editUserProfile", {
          user: req.session.user,
          showWelcomeModal: true,
          message: "¡Bienvenido! Completa tu perfil para continuar.",
        });
      }

      // Si no es nuevo, flujo normal al Home
      return res.redirect("/");
    });
  } catch (error) {
    console.error(
      "Error en puente Web-API:",
      error.response?.data || error.message,
    );
    res.redirect("/login?error=social_auth_failed");
  }
}

async function refreshToken(req, res) {
  const { idToken } = req.body;

  // Validación básica

  if (!req.session?.user) {
    console.warn("Refresh fallido: sesión de Express no iniciada");
    return res.json({ ok: false, message: "Sesión de Express no iniciada" });
  }

  if (!idToken) {
    console.warn("Refresh fallido: idToken presente: ", !!idToken);

    return res.status(401).json({
      ok: false,
      message: "No autorizado o token no suministrado",
    });
  }

  if (req.session.idToken === idToken) {
    return res.json({ ok: true, message: "Token ya estaba actualizado" });
  }

  // Actualizamos el token en la sesión
  req.session.idToken = idToken;

  // Forzamos el guardado de la sesión para evitar condiciones de carrera
  req.session.save((err) => {
    if (err) {
      console.error("Error al guardar la sesión tras refresh:", err);
      return res.status(500).json({ ok: false });
    }
    console.log(`Token actualizado para el usuario: ${req.session.user.email}`);
    res.json({ ok: true });
  });
}

// async function socialLogin(req, res) {
//   const { idToken } = req.body;

//   try {
//     // 1. Enviamos el token a la API para validar/crear usuario
//     const apiResponse = await apiClient.post("/auth/social-login", {
//       idToken,
//     });

//     const { user, isNewUser } = apiResponse.data;

//     // 2. CREAR SESIÓN: Guardamos al usuario en la sesión de la web
//     req.session.user = user;
//     req.session.idToken = idToken;

//     // 3. Redirigimos al Home o al Perfil
//     req.session.save((err) => {
//       if (err) {
//         console.error("Error al guardar sesión:", err);
//         return res.redirect("/login?error=session_error");
//       }

//       // Solo cuando el store confirma el guardado, se redirecciona al usuario
//       return res.redirect("/");
//     });
//   } catch (error) {
//     console.error(
//       "Error en puente Web-API:",
//       error.response?.data || error.message,
//     );
//     res.redirect("/login?error=social_auth_failed");
//   }
// }

export default {
  showLogin,
  login,
  logout,
  protect,
  register,
  showRegister,
  socialLogin,
  refreshToken,
};
