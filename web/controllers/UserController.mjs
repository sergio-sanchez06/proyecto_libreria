import { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redisController from "./RedisController.mjs";
import jwt from "jsonwebtoken";

async function getProfile(req, res) {
  // 1. Verificación de seguridad en el controlador web
  if (!req.session?.user || !req.session?.idToken) {
    console.log("Sesión no encontrada o token ausente");
    return res.redirect("/login");
  }

  const user = req.session.user;
  const userId = user.id || user.user?.id; // Intenta leer ambos formatos

  console.log(userId);

  if (!userId) {
    console.error("Estructura de usuario no reconocida:", user);
    return res.redirect("/login?error=error_sesion");
  }

  console.log("Usuario en sesión:", req.session.user);
  console.log("Id del usuario en sesión:", req.session.user.id);
  console.log("Token en sesión:", req.session.idToken ? "Presente" : "Ausente");

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

    const api = getAuthenticatedClient(cleanToken);

    const provider = jwt.decode(req.session.idToken).firebase.sign_in_provider;

    const response = await api.get("/users/me/" + req.session.user.id);

    res.render("partials/perfil", {
      user: req.session.user,
      profile: response.data,
      error: null,
      provider: provider,
    });
  } catch (error) {
    console.error(
      "Error en getProfile (Web):",
      error.response?.data || error.message,
    );

    // Si la API dice que el token expiró (401/403), mandamos al login
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.redirect("/login");
    }

    res.render("partials/perfil", {
      user: req.session.user,
      profile: null,
      error:
        "No se pudo conectar con el servidor para cargar tus datos detallados.",
    });
  }
}

// En tu WEB: controllers/UserController.mjs -> getPurchaseHistory
async function getPurchaseHistory(req, res) {
  const { success, session_id } = req.query;

  const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
  const api = getAuthenticatedClient(cleanToken);

  try {
    // Si venimos de Stripe con éxito
    if (success === "true" && session_id) {
      try {
        // 1. Validamos el pago contra nuestra API
        const confirmation = await api.get(
          `/orders/stripe/confirm-session?session_id=${session_id}`,
        );

        if (confirmation.status === 200) {
          // 2. BORRAMOS LA COOKIE (Asegúrate de que las opciones coincidan con la creación)
          res.clearCookie("cart", {
            signed: true,
            httpOnly: true,
            secure: false, // Cámbialo a true si estás en producción con HTTPS
            path: "/",
          });

          // 3. REDIRECCIÓN DE LIMPIEZA: Evita que el usuario refresque y se repita el proceso[cite: 3]
          return res.redirect("/user/myOrders?confirmed=true");
        }
      } catch (err) {
        console.error("La confirmación de la API falló:", err.message);
      }
    }

    const response = await api.get("/orders/user/" + req.session.user.id);
    const orders = response.data || [];

    if (orders.length > 0) {
      for (let order of orders) {
        const responseItems = await api.get("/orderItems/" + order.id);
        order.items = responseItems.data;

        const recommendationBasedUponBuy = await api.post(
          "/books/mostSoldRecommendation",
          { user_id: req.session.user.id },
        ); //esto es una lista de libros, se devuelve igual que los mas vendidos
      }
    }

    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: orders,
      successMessage:
        req.query.confirmed === "true" ? "¡Compra realizada con éxito!" : null,
    });
  } catch (error) {
    // Manejo de errores...

    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No se pudo procesar el pedido, inténtalo de nuevo.",
    };

    res.redirect("/cart/view");
  }
}

// async function getPurchaseHistory(req, res) {
//   console.log("Entrando a Mis Compras - Confirmación de Stripe activada");

//   if (!req.session.user || !req.session.idToken) {
//     return res.redirect("/login");
//   }

//   const { success, session_id } = req.query; // Capturamos los parámetros de Stripe
//   const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//   const api = getAuthenticatedClient(cleanToken);

//   try {
//     // --- NUEVA LÓGICA: Confirmación de Pago ---
//     if (success === "true" && session_id) {
//       console.log(
//         "Detectado retorno de Stripe, confirmando sesión:",
//         session_id,
//       );

//       try {
//         // Llamamos a la nueva ruta de la API (que crearemos a continuación)
//         await api.get(
//           `/orders/stripe/confirm-session?session_id=${session_id}`,
//         );

//         console.log("Pedido confirmado con éxito, Ahora borramos la cookie");

//         // Si la confirmación tiene éxito, limpiamos la cookie del carrito
//         res.clearCookie("cart", {
//           signed: true,
//           httpOnly: true,
//           secure: false, // Igual a como la creaste
//         });
//         console.log("✅ Pedido confirmado y carrito limpiado");
//       } catch (confirmError) {
//         console.error(
//           "Error al confirmar pedido en API:",
//           confirmError.response?.data || confirmError.message,
//         );
//         // No bloqueamos la vista, simplemente el pedido podría no aparecer aún
//       }
//     }
//     // --- FIN LÓGICA CONFIRMACIÓN ---

//     // Carga normal de pedidos que ya tenías
//     const response = await api.get("/orders/user/" + req.session.user.id);
//     const orders = response.data || [];

//     if (orders.length > 0) {
//       for (let order of orders) {
//         const responseItems = await api.get("/orderItems/" + order.id);
//         order.items = responseItems.data;

//         const recommendationBasedUponBuy = await api.post(
//           "/books/mostSoldRecommendation",
//           { user_id: req.session.user.id },
//         ); //esto es una lista de libros, se devuelve igual que los mas vendidos
//       }
//     }

//     res.render("partials/purchaseHistory", {
//       title: "Mis compras",
//       user: req.session.user,
//       orders: orders,
//       successMessage:
//         success === "true"
//           ? "¡Gracias por tu compra! El pago se procesó correctamente."
//           : null,
//     });
//   } catch (error) {
//     console.error("Error en getPurchaseHistory:", error.message);
//     res.render("partials/purchaseHistory", {
//       title: "Mis compras",
//       user: req.session.user,
//       orders: [],
//       error: "Error al cargar el historial de compras.",
//     });
//   }
// }

// async function getPurchaseHistory(req, res) {
//   console.log(
//     "Hemos entrado al controlador de mis compras - Versión Optimizada",
//   );

//   if (!req.session.user || !req.session.idToken) {
//     return res.redirect("/login");
//   }

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     console.log("req.session.user.id", req.session.user.id);

//     const response = await api.get("/orders/user/" + req.session.user.id);
//     const orders = response.data || [];

//     if (orders.length > 0) {
//       for (let order of orders) {
//         const responseItems = await api.get("/orderItems/" + order.id);
//         order.items = responseItems.data;
//       }

//       console.log("orders", orders);
//       console.log("orders[0].items", orders[0].items);
//     }

//     res.render("partials/purchaseHistory", {
//       title: "Mis compras",
//       user: req.session.user,
//       orders: orders,
//     });
//   } catch (error) {
//     console.error("Error en getPurchaseHistory:", error.message);
//     res.render("partials/purchaseHistory", {
//       title: "Mis compras",
//       user: req.session.user,
//       orders: [],
//       error: "Error al cargar el historial de compras.",
//     });
//   }
// }

async function getEditProfileForm(req, res) {
  console.log("Hemos entrado al controlador de editar perfil");

  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // 1. Obtener los datos del usuario
    const response = await api.get("/users/me/" + req.session.user.id);

    console.log(response.data.user);

    // 2. Renderizar la plantilla con los datos del usuario
    res.render("partials/editUserProfile", {
      user: response.data.user,
    });
  } catch (error) {
    console.error("Error en editProfile:", error.message);
    res.render("partials/editUserProfile", {
      user: null,
      error: "Error al cargar los datos del usuario.",
    });
  }
}

async function updateProfile(req, res) {
  console.log("WEB UPDATE USER");

  console.log("Params", req.params);
  console.log("Body", req.body);

  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  if (String(req.session.user.id) !== String(req.body.id)) {
    console.log("ID distinto");

    return res.redirect("/user/profile");
  }

  try {
    console.log("Hemos entrado al controlador de actualizar perfil");
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    console.log(req.body, req.session.user.id);

    // 1. Obtener los datos del usuario
    const response = await api.put(
      "/users/profile/" + req.session.user.id,
      req.body,
    );

    console.log(response.data);

    const user = response.data.user;

    console.log(user.optional_address);

    const redisClient = await redisController.returnRedisClient();
    await redisClient.del(`user:validation:${req.session.user.id}`);

    req.session.user = user;

    // Forzamos la persistencia en Redis
    req.session.save((err) => {
      if (err) {
        console.error("Error guardando en Redis:", err);
        return res.redirect("/user/profile?error=session_sync");
      }

      // Solo redirigimos cuando Redis ha confirmado que guardó los datos
      console.log("Sesión sincronizada en Redis. Redirigiendo...");
      res.redirect("/user/profile");
    });
  } catch (error) {
    console.error("Error en editProfile:", error.message);
    res.render("partials/editUserProfile", {
      user: req.session.user,
      error:
        "Error al actualizar los datos: " +
        (error.response?.data?.message || error.message),
    });
  }
}

async function dismissSelf(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  const userId = req.body.id;
  const deleteMode = req.body.mode || "soft"; // 'soft' (por defecto) o 'hard'

  if (userId !== req.session.user.id.toString()) {
    console.error("Intento de borrar una cuenta que no pertenece a la sesión");
    return res.redirect("/user/perfil");
  }

  try {
    console.log("Hemos entrado al controlador de eliminar perfil");
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // 1. Obtener los datos del usuario
    const response = await api.delete("/users/dismissSelf/" + userId, {
      data: { mode: deleteMode },
    });
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        return res.redirect("/");
      }
      // 3. Limpiar la cookie del navegador
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  } catch (error) {
    console.error(
      "Error en dismissSelf:",
      error.response?.data || error.message,
    );
    res.render("partials/perfil", {
      user: req.session.user || null,
      error:
        "No se pudo procesar la solicitud de eliminación. Contacte con soporte.",
    });
  }
}

async function getMyReviews(req, res) {
  console.log("Hemos entrado al controlador de mis reseñas");

  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    const response = await api.get("/review/user/" + req.session.user.id);
    const reviews = response.data;

    console.log("reviews", reviews);

    res.render("partials/myReviews", {
      title: "Mis reseñas",
      user: req.session.user,
      reviews: reviews,
    });
  } catch (error) {
    console.error("Error en getMyReviews:", error.message);
    res.render("partials/myReviews", {
      title: "Mis reseñas",
      user: req.session.user,
      reviews: [],
      error: "Error al cargar las reseñas.",
    });
  }
}

async function changeMyPass(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    res.render("partials/passChange", {
      title: "Cambiar Contraseña",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error en changeMyPass:", error.message);
    res.render("/login", {
      error: "Error al cargar las reseñas.",
    });
  }
}

async function changeMyPassReturn(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);
    res.redirect("/user/profile");
  } catch (error) {
    console.error("Error en changeMyPass:", error.message);
    res.render("/login", {
      error: "Error al cargar las reseñas.",
    });
  }
}

async function saveFavoriteGenres(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);
    const userId = req.session.user.id;

    let genreIds = req.body.genre_ids || [];
    if (!Array.isArray(genreIds)) genreIds = [genreIds];
    genreIds = genreIds.map(Number).filter(Boolean);

    await api.post(`/users/favorites/${userId}`, { genre_ids: genreIds });

    req.session.flash = {
      type: "success",
      message: "Géneros favoritos actualizados correctamente.",
    };
    res.redirect("/user/recommendations");
  } catch (error) {
    console.error("Error en saveFavoriteGenres:", error.message);
    req.session.flash = {
      type: "error",
      message: "No se pudieron guardar los géneros favoritos.",
    };
    res.redirect("/user/favorites");
  }
}

async function getFavoritesPage(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);
    const userId = req.session.user.id;

    // Cargamos todos los géneros y los favoritos del usuario en paralelo
    const [allGenresRes, favoritesRes] = await Promise.allSettled([
      api.get("/genres/all"),
      api.get(`/users/favorites/${userId}`),
    ]);

    const allGenres =
      allGenresRes.status === "fulfilled" ? allGenresRes.value.data : [];
    const favoriteGenres =
      favoritesRes.status === "fulfilled" ? favoritesRes.value.data : [];

    const flash = req.session.flash || null;
    delete req.session.flash;

    res.render("partials/favoriteGenres", {
      user: req.session.user,
      allGenres,
      favoriteGenres,
      flash,
      error: null,
    });
  } catch (error) {
    console.error("Error en getFavoritesPage:", error.message);
    res.render("partials/favoriteGenres", {
      user: req.session.user,
      allGenres: [],
      favoriteGenres: [],
      flash: null,
      error: "No se pudieron cargar los géneros.",
    });
  }
}

async function getRecommendationsPage(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);
    const userId = req.session.user.id;

    const [mostSoldRes, bestRatedRes, combinedRes, favoritesRes] =
      await Promise.allSettled([
        api.get(`/books/recommendations/mostSold/${userId}`),
        api.get(`/books/recommendations/bestRated/${userId}`),
        api.get(`/books/recommendations/combined/${userId}`),
        api.get(`/users/favorites/${userId}`),
      ]);

    const favoriteGenres =
      favoritesRes.status === "fulfilled" ? favoritesRes.value.data : [];

    let mostSoldRaw =
      mostSoldRes.status === "fulfilled" ? mostSoldRes.value.data : [];
    let bestRatedRaw =
      bestRatedRes.status === "fulfilled" ? bestRatedRes.value.data : [];
    let combined =
      combinedRes.status === "fulfilled" ? combinedRes.value.data : [];

    // ── Si no tiene géneros favoritos → fallback con datos globales ──────────
    const hasFavorites = favoriteGenres.length > 0;

    if (!hasFavorites) {
      // Cargar los más vendidos y mejor valorados globales en paralelo
      const [globalMostSoldRes, globalBestRatedRes] = await Promise.allSettled([
        api.get("/books/mostSold"),
        api.get("/books/bestRated"),
      ]);

      mostSoldRaw =
        globalMostSoldRes.status === "fulfilled"
          ? globalMostSoldRes.value.data
          : [];
      bestRatedRaw =
        globalBestRatedRes.status === "fulfilled"
          ? globalBestRatedRes.value.data
          : [];
      combined = []; // No hay combinado sin favoritos
    }

    // ── Deduplicación ────────────────────────────────────────────────────────
    // ✅ Después — cada pestaña deduplica solo respecto a la anterior
    // combined → libros únicos suyos
    // mostSold → quita los de combined
    // bestRated → quita los de combined Y mostSold
    const combinedIds = new Set(combined.map((b) => b.id));

    const mostSold = mostSoldRaw.filter((b) => !combinedIds.has(b.id));

    const mostSoldIds = new Set(mostSold.map((b) => b.id));

    const bestRated = bestRatedRaw.filter(
      (b) => !combinedIds.has(b.id) && !mostSoldIds.has(b.id),
    );

    res.render("partials/recommendations", {
      user: req.session.user,
      mostSold,
      bestRated,
      combined,
      favoriteGenres,
      hasFavorites, // ← nuevo flag para la vista
      error: null,
    });
  } catch (error) {
    console.error("Error en getRecommendationsPage:", error.message);
    res.render("partials/recommendations", {
      user: req.session.user,
      mostSold: [],
      bestRated: [],
      combined: [],
      favoriteGenres: [],
      hasFavorites: false,
      error: "No se pudieron cargar las recomendaciones.",
    });
  }
}

// async function getRecommendationsPage(req, res) {
//   if (!req.session.user || !req.session.idToken) {
//     return res.redirect("/login");
//   }

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);
//     const userId = req.session.user.id;

//     // Las tres consultas de recomendación en paralelo
//     const [mostSoldRes, bestRatedRes, combinedRes, favoritesRes] =
//       await Promise.allSettled([
//         api.get(`/books/recommendations/mostSold/${userId}`),
//         api.get(`/books/recommendations/bestRated/${userId}`),
//         api.get(`/books/recommendations/combined/${userId}`),
//         api.get(`/users/favorites/${userId}`),
//       ]);

//     // Extraer datos o arrays vacíos si fallan
//     let mostSoldRaw =
//       mostSoldRes.status === "fulfilled" ? mostSoldRes.value.data : [];
//     let bestRatedRaw =
//       bestRatedRes.status === "fulfilled" ? bestRatedRes.value.data : [];
//     const combined =
//       combinedRes.status === "fulfilled" ? combinedRes.value.data : [];
//     const favoriteGenres =
//       favoritesRes.status === "fulfilled" ? favoritesRes.value.data : [];

//     // ─── LIMPIEZA DE DUPLICADOS ───
//     // Creamos un set con los IDs de los libros en 'combined' para priorizarlos
//     const seenBookIds = new Set(combined.map((book) => book.id));

//     // Filtramos 'Tendencias' para quitar los que ya están en 'Selección Especial'
//     const mostSold = mostSoldRaw.filter((book) => {
//       if (seenBookIds.has(book.id)) return false;
//       seenBookIds.add(book.id); // Registramos para que no aparezca tampoco en Crítica
//       return true;
//     });

//     // Filtramos 'Crítica' para quitar los que ya están en cualquiera de las anteriores
//     const bestRated = bestRatedRaw.filter((book) => {
//       if (seenBookIds.has(book.id)) return false;
//       return true;
//     });
//     // ──────────────────────────────

//     console.log("Lo que le paso a recomendaciones:", {
//       mostSold,
//       bestRated,
//       combined,
//       favoriteGenres,
//       error: null,
//     })

//     res.render("partials/recommendations", {
//       user: req.session.user,
//       mostSold,
//       bestRated,
//       combined,
//       favoriteGenres,
//       error: null,
//     });
//   } catch (error) {
//     console.error("Error en getRecommendationsPage:", error.message);
//     res.render("partials/recommendations", {
//       user: req.session.user,
//       mostSold: [],
//       bestRated: [],
//       combined: [],
//       favoriteGenres: [],
//       error: "No se pudieron cargar las recomendaciones.",
//     });
//   }
// }

export default {
  getProfile,
  getPurchaseHistory,
  getEditProfileForm,
  updateProfile,
  dismissSelf,
  getMyReviews,
  changeMyPass,
  changeMyPassReturn,
  saveFavoriteGenres,
  getFavoritesPage,
  getRecommendationsPage,
};
