import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redisController from "./RedisController.mjs";

let redisClient = null;

async function getManageBooks(req, res) {
  try {
    // Definimos el cliente de redis
    redisClient = await redisController.returnRedisClient();

    const page = req.query.page || 1;
    const q = req.query.q || "";
    const maxPrice = req.query.maxPrice || "";
    const genre = req.query.genre || "";
    const author = req.query.author || "";
    const deleted = req.query.deleted || "false";

    const [cachedGenres, cachedAuthors] = await Promise.all([
      redisClient.get("AllGenres"),
      redisClient.get("AllAuthors"),
    ]);

    let genres = cachedGenres ? JSON.parse(cachedGenres) : null;
    let authors = cachedAuthors ? JSON.parse(cachedAuthors) : null;

    if (!genres || !authors) {
      const [genresResponse, authorsResponse] = await Promise.all([
        !genres ? apiClient.get("/genres/all") : null,
        !authors ? apiClient.get("/authors") : null,
      ]);

      if (genresResponse) {
        genres = genresResponse.data;
        await redisClient.set("AllGenres", JSON.stringify(genres), {
          EX: 3600,
        });
      }

      if (authorsResponse) {
        authors = authorsResponse.data;
        await redisClient.set("AllAuthors", JSON.stringify(authors), {
          EX: 3600,
        });
      }
    }

    const booksResponse = await apiClient.get(`/books`, {
      params: { page, q, maxPrice, genre, author, deleted },
    });

    res.render("admin/books_list", {
      books: booksResponse.data.data,
      genres: genres,
      authors: authors,
      currentPage: booksResponse.data.currentPage,
      totalPages: booksResponse.data.totalPages,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros: ", error);
    res.status(500).render("error", {
      message: "Error al cargar el catálogo de administración",
    });
  }
}

export const getForm = (req, res) => {
  const { type } = req.params;
  res.render("admin/form_general", {
    title: `Gestionar ${type}`,
    type: type,
  });
};

async function getManageOrders(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/orders");
    const allOrders = response.data;

    // ── Paginación ──────────────────────────────────────
    const PAGE_SIZE = 10;
    const currentPage = Math.max(1, parseInt(req.query.page) || 1);
    const totalPages = Math.ceil(allOrders.length / PAGE_SIZE);
    const pageOrders = allOrders.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

    // Solo cargamos los items de la página actual
    const batchSize = 5;
    for (let i = 0; i < pageOrders.length; i += batchSize) {
      const batch = pageOrders.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (order) => {
          try {
            const resItems = await api.get("/orderItems/" + order.id);
            order.items = resItems.data;
          } catch (err) {
            order.items = [];
          }
        }),
      );
    }

    const globalStats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === "PENDIENTE").length,
      processing: allOrders.filter(
        (o) => o.status === "PROCESANDO" || o.status === "ENVIADO",
      ).length,
      revenue: allOrders
        .reduce((acc, o) => acc + parseFloat(o.total || 0), 0)
        .toFixed(2),
    };

    res.render("admin/orders", {
      orders: pageOrders,
      totalOrders: allOrders.length,
      globalStats,
      currentPage,
      totalPages,
      lang: req.session.lang,
      isPending: false,
    });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    res.status(500).render("error", {
      message: "No se pudieron cargar los pedidos",
    });
  }
}

async function getPendingOrders(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/orders");
    const allOrders = response.data;

    // Filtrar solo los pendientes
    const pendingOrders = allOrders.filter((o) => o.status === "PENDIENTE");

    // ── Paginación ──────────────────────────────────────
    const PAGE_SIZE = 10;
    const currentPage = Math.max(1, parseInt(req.query.page) || 1);
    const totalPages = Math.ceil(pendingOrders.length / PAGE_SIZE);
    const pageOrders = pendingOrders.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

    // Solo cargamos los items de la página actual
    const batchSize = 5;
    for (let i = 0; i < pageOrders.length; i += batchSize) {
      const batch = pageOrders.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (order) => {
          try {
            const resItems = await api.get("/orderItems/" + order.id);
            order.items = resItems.data;
          } catch (err) {
            order.items = [];
          }
        }),
      );
    }

    const globalStats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === "PENDIENTE").length,
      processing: allOrders.filter(
        (o) => o.status === "PROCESANDO" || o.status === "ENVIADO",
      ).length,
      revenue: allOrders
        .reduce((acc, o) => acc + parseFloat(o.total || 0), 0)
        .toFixed(2),
    };

    res.render("admin/orders", {
      orders: pageOrders,
      totalOrders: pendingOrders.length,
      globalStats,
      currentPage,
      totalPages,
      lang: req.session.lang,
      isPending: true,
    });
  } catch (error) {
    console.error("Error al cargar pedidos pendientes:", error);
    res.render("errors/500", {
      error: "No se pudieron cargar los pedidos pendientes",
    });
  }
}

async function listUsers(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    const api = getAuthenticatedClient(req.session.idToken);

    const [cachedUsers] = await Promise.all([redisClient.get("AllUsers")]);

    let users = cachedUsers ? JSON.parse(cachedUsers) : null;

    if (!users) {
      const [usersResponse] = await Promise.all([
        !users ? api.get("/users") : null,
      ]);

      if (usersResponse) {
        users = usersResponse.data;
        await redisClient.set("AllUsers", JSON.stringify(users), { EX: 600 }); //Duración de la caché: 5 minutos
      }
    }

    res.render("admin/users_list", {
      users: users,
      message: req.query.msg || null,
    });
  } catch (error) {
    res
      .status(500)
      .render("error", { message: "No se pudieron cargar los usuarios" });
  }
}

async function getCreateUserForm(req, res) {
  const formData = req.session.formData || null;
  const error = req.session.error || null;

  delete req.session.formData;
  delete req.session.error;

  res.render("admin/add_user", {
    title: "Agregar Usuario",
    user: req.session.user,
    error: error,
    formData: formData,
  });
}

async function createUser(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    const api = getAuthenticatedClient(req.session.idToken);
    console.log(req.session.idToken);

    const response = await api.post("/users", req.body);
    const user = response.data;

    try {
      await Promise.all([
        redisClient.del("AllUsers"),
        redisClient.del("stats:users_count"),
      ]);
    } catch (error) {
      console.error(
        "Error al invalidar la caché de usuarios en createUser:",
        error,
      );
    }

    req.session.flash = {
      type: "success",
      message: "Usuario creado correctamente.",
    };
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al crear usuario:", error);
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al crear el usuario.",
    };
    res.redirect("/admin/users/create");
  }
}

async function getUpdateUserForm(req, res) {
  const { id } = req.params;

  try {
    const response = await apiClient.get(`/users/${id}`, {
      headers: { Authorization: `Bearer ${req.session.idToken}` },
    });
    const user = response.data;
    res.render("admin/update_user", {
      title: "Actualizar Usuario",
      user: user,
      error: req.query.error || null,
    });
  } catch (error) {
    res.render("errors/500", { error: "No se pudo cargar el usuario" });
  }
}

async function updateUser(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    const api = getAuthenticatedClient(req.session.idToken);

    const response = await api.put(`/users/${req.params.id}`, req.body);
    const user = response.data;

    try {
      await Promise.all([
        redisClient.del("AllUsers"),
        redisClient.del("stats:users_count"),
      ]);
    } catch (error) {
      console.error(
        "Error al invalidar la caché de usuarios en updateUser:",
        error,
      );
    }

    req.session.flash = { type: "success", message: "Usuario actualizado." };
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message || "Error al actualizar el usuario.",
    };
    res.redirect(`/admin/users/update/${req.params.id}`);
  }
}

async function deleteUser(req, res) {
  try {
    // 1. Verificación de seguridad: ¿Viene el ID del formulario EJS?
    if (!req.body || !req.body.id) {
      throw new Error(
        "El ID del usuario es requerido en el cuerpo del formulario",
      );
    }

    redisClient = await redisController.returnRedisClient();

    const { id, mode } = req.body;

    console.log("Id del usuario: " + id);
    console.log("Mode: " + mode);

    const api = getAuthenticatedClient(req.session.idToken);

    await api.put(`/users/delete/${id}`, { mode });

    try {
      await Promise.all([
        redisClient.del("AllUsers"),
        redisClient.del("stats:users_count"),
      ]);
    } catch (error) {
      console.error(
        "Error al invalidar la caché de usuarios en deleteUser:",
        error,
      );
    }

    req.session.flash = {
      type: "success",
      message: `Usuario ${mode === "soft" ? "desactivado" : "eliminado"} correctamente.`,
    };
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message || "No se pudo eliminar el usuario.",
    };
    res.redirect("/admin/users");
  }
}

async function reactivateUser(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    // 1. Obtenemos el ID de los parámetros de la ruta
    const { id } = req.body;

    console.log("Id para reactivar: " + id);

    // 2. Preparamos el cliente autenticado
    const api = getAuthenticatedClient(req.session.idToken);

    // 3. Llamamos al API.
    // Usamos la ruta basada en ID que definimos en el controlador del API:
    // /users/reactivate/:id (o /users/restore/:id según cómo la hayas nombrado en tus rutas)
    await api.put(`/users/reactivate/${id}`);

    try {
      await Promise.all([
        redisClient.del("AllUsers"),
        redisClient.del("stats:users_count"),
      ]);
    } catch (error) {
      console.error(
        "Error al invalidar la caché de usuarios en reactivateUser:",
        error,
      );
    }

    // 4. Si todo va bien, redirigimos con un mensaje de éxito
    // Nota: Si usas un sistema de flash messages, podrías usarlo aquí
    res.redirect("/admin/users");
  } catch (error) {
    console.error(
      "Error al restaurar usuario en el Web Controller:",
      error.message,
    );

    // Capturamos el mensaje de error que viene del API si existe
    const errorMessage =
      error.response?.data?.message || "No se pudo restaurar el usuario";

    res.redirect(`/admin/users?error=${encodeURIComponent(errorMessage)}`);
  }
}

async function getDashboard(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/login");
  }

  try {
    redisClient = await redisController.returnRedisClient();

    // 1. Intentamos recuperar las ESTADÍSTICAS (solo el número)
    const [cachedUsersCount, cachedOrdersCount] = await Promise.all([
      redisClient.get("stats:users_count"),
      redisClient.get("stats:orders_count"),
    ]);

    let usersCount = cachedUsersCount ? JSON.parse(cachedUsersCount) : null;
    let ordersCount = cachedOrdersCount ? JSON.parse(cachedOrdersCount) : null;

    // 2. Si alguno no está en caché, vamos a la API
    if (usersCount === null || ordersCount === null) {
      const api = getAuthenticatedClient(req.session.idToken);

      const [usersResponse, ordersResponse] = await Promise.all([
        usersCount === null ? api.get("/users") : Promise.resolve(null),
        ordersCount === null ? api.get("/orders") : Promise.resolve(null),
      ]);

      if (usersResponse) {
        usersCount = usersResponse.data.length;
        // Guardamos con clave específica de estadística
        await redisClient.set("stats:users_count", JSON.stringify(usersCount), {
          EX: 600,
        });
      }

      if (ordersResponse) {
        ordersCount = ordersResponse.data.length;
        // Guardamos con clave específica de estadística
        await redisClient.set(
          "stats:orders_count",
          JSON.stringify(ordersCount),
          { EX: 600 },
        );
      }
    }

    // 3. Renderizamos usando las variables que ya tienen datos
    res.render("admin/dashboard", {
      title: "Consola de Administración",
      user: req.session.user,
      users: usersCount, // Antes pasabas 'users' que venía de "AllUsers"
      orders: ordersCount, // Antes pasabas 'orders' que venía de "AllOrders"
    });
  } catch (error) {
    console.error("Error en Dashboard:", error);
    if (error.response?.status === 401)
      return res.redirect("/login?msg=expirado");

    // Fallback por si todo falla
    res.render("admin/dashboard", {
      title: "Consola de Administración",
      user: req.session.user,
      users: 0,
      orders: 0,
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const urlId = req.params.id;
    const { orderId, status } = req.body;

    // 2. Validación de consistencia (Seguridad)
    if (String(orderId) !== String(urlId)) {
      console.error("Divergencia de IDs detectada en UpdateStatus");
      return res.redirect("/admin/orders?error=invalid_id");
    }

    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.put(`/orders/${req.body.orderId}`, req.body);
    const order = response.data;
    req.session.flash = {
      type: "success",
      message: "Estado del pedido actualizado.",
    };
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al cambiar el estado.",
    };
    res.redirect("/admin/orders");
  }
}

async function cancelOrder(req, res) {
  try {
    const urlId = req.params.id;
    const { orderId, status } = req.body;

    // 2. Validación de consistencia (Seguridad)
    if (String(orderId) !== String(urlId)) {
      console.error("Divergencia de IDs detectada en UpdateStatus");
      req.session.flash = {
        type: "error",
        message: "Error de seguridad al cancelar el pedido.",
      };
      return res.redirect("/admin/orders");
    }

    const nocancelable = ["ENVIADO", "ENTREGADO", "CANCELADO"];
    if (nocancelable.includes(status?.toUpperCase())) {
      req.session.flash = {
        type: "error",
        message: "El estado del pedido no permite su cancelación.",
      };
      return res.redirect("/admin/orders");
    }

    const api = getAuthenticatedClient(req.session.idToken);
    // const response = await api.patch(`/orders/cancel/${orderId}`);
    // const order = response.data;
    // req.session.flash = {
    //   type: "success",
    //   message: order.message,
    // };
    // res.redirect("/admin/orders");

    const { data } = await api.post(`/orders/admin/cancel/${orderId}`);

    req.session.flash = {
      type: "success",
      message: data.message || "Pedido cancelado correctamente.",
    };
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.error || "No se pudo eliminar el pedido.",
    };
    res.redirect("/admin/orders");
  }
}

async function getManageReviews(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/review/all");
    const allReviews = response.data;

    // ── Estadísticas ───────────────────────────────────
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0 
      ? (allReviews.reduce((acc, r) => acc + parseInt(r.rating), 0) / totalReviews).toFixed(1)
      : 0;

    // ── Paginación ──────────────────────────────────────
    const PAGE_SIZE = 10;
    const currentPage = Math.max(1, parseInt(req.query.page) || 1);
    const totalPages = Math.ceil(totalReviews / PAGE_SIZE);
    
    const pageReviews = allReviews.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

    res.render("admin/reviewsTable", {
      reviews: pageReviews,
      stats: {
        total: totalReviews,
        average: avgRating
      },
      currentPage,
      totalPages,
      message: req.query.msg || null,
    });
  } catch (error) {
    console.error("Error al cargar reseñas:", error);
    res
      .status(500)
      .render("error", { message: "No se pudieron cargar las reseñas" });
  }
}

async function deleteReview(req, res) {
  console.log(req.params.id);
  console.log(req.session.user.id);

  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.delete(`/review/admin/delete/${req.params.id}`);
    const review = response.data;
    req.session.flash = {
      type: "success",
      message: "Reseña eliminada por el administrador.",
    };
    res.redirect("/admin/reviews");
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    req.session.flash = {
      type: "error",
      message: "Error al eliminar la reseña.",
    };
    res.redirect("/admin/reviews");
  }
}

async function updateReview(req, res) {
  const { id } = req.params;
  const { rating, comment } = req.body;

  console.log(id);
  console.log(rating);
  console.log(comment);

  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.put(`/review/admin/update/${id}`, {
      rating,
      comment,
    });
    const review = response.data;
    req.session.flash = {
      type: "success",
      message: "Reseña moderada correctamente.",
    };
    res.redirect("/admin/reviews");
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    req.session.flash = {
      type: "error",
      message: "Error al actualizar la reseña.",
    };
    res.redirect("/admin/reviews");
  }
}

async function getManagedGenres(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/genres");
  }
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/genres/all?includeDeleted=true");
    res.render("admin/genres_list", {
      genres: response.data,
      user: req.session.user,
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error al obtener los géneros",
    });
  }
}

async function createGenre(req, res) {
  try {
    // 1. Limpiamos el token para evitar el "Bearer Bearer"
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    console.log("Nuevo genero: ", req.body);

    // 2. Llamada a la API
    await api.post("/genres", req.body);

    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género creado con éxito.",
    };

    res.redirect("/admin/genres/list");
  } catch (error) {
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al crear el género.",
    };
    res.redirect("/admin/genres/list");
  }
}

async function deleteGenre(req, res) {
  try {
    const id = req.body.id;
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/genres/${id}`);

    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género eliminado satisfactoriamente.",
    };
    res.redirect("/admin/genres/list");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No se puede eliminar: el género podría estar en uso.",
    };
    res.redirect("/admin/genres/list");
  }
}

async function restoreGenre(req, res) {
  console.log("Entramos en restoreGenre");

  try {
    const id = req.body.id;
    const urlId = req.params.id;

    if (!id || id != urlId) {
      req.session.flash = {
        type: "error",
        message: "ID de género inválido.",
      };
      res.redirect("/admin/genres/list");
      return;
    }

    const api = getAuthenticatedClient(req.session.idToken);

    await api.put(`/genres/restore/${id}`);
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género restaurado correctamente.",
    };
    res.redirect("/admin/genres/list");
  } catch (error) {
    console.log(error);
    console.log(error.response.data.message);

    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al restaurar el género.",
    };
    res.redirect("/admin/genres/list");
  }
}

async function adminConfirmReturn(req, res) {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    // Validación de seguridad similar a la que ya tienes
    if (String(orderId) !== String(id)) {
      req.session.flash = { type: "error", message: "Error de seguridad." };
      return res.redirect("/admin/orders");
    }

    const api = getAuthenticatedClient(req.session.idToken);

    // Llamada a la API para ejecutar reembolso y stock
    const { data } = await api.post(`/orders/admin/confirm-return/${orderId}`);

    req.session.flash = {
      type: "success",
      message: data.message || "Devolución confirmada y reembolso emitido.",
    };
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al confirmar devolución:", error);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.error || "Error al procesar el reembolso.",
    };
    res.redirect("/admin/orders");
  }
}

async function adminRejectReturn(req, res) {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    // Validación de seguridad similar a la que ya tienes
    if (String(orderId) !== String(id)) {
      req.session.flash = { type: "error", message: "Error de seguridad." };
      return res.redirect("/admin/orders");
    }

    const api = getAuthenticatedClient(req.session.idToken);

    // Llamada a la API para ejecutar reembolso y stock
    const { data } = await api.post(`/orders/admin/reject-return/${orderId}`);

    req.session.flash = {
      type: "success",
      message: data.message || "Devolución rechazada.",
    };
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al rechazar devolución:", error);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.error || "Error al procesar el rechazo.",
    };
    res.redirect("/admin/orders");
  }
}

// 2. FORZAR (El admin decide devolverlo aunque el usuario no haya hecho nada)
async function adminForceReturn(req, res) {
  try {
    const { id } = req.params;

    const { orderId } = req.body;

    if (String(orderId) !== String(id)) {
      // ← fix 4: validación de consistencia
      req.session.flash = { type: "error", message: "Error de seguridad." };
      return res.redirect("/admin/orders");
    }

    const api = getAuthenticatedClient(req.session.idToken);

    // Llamada al endpoint de "fuerza bruta" para admins
    const { data } = await api.post(`/orders/admin/force-return/${id}`);

    req.session.flash = {
      type: "success",
      message:
        data.message ||
        "Devolución forzada por el administrador correctamente.",
    };

    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al forzar devolución:", error);
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.error || "No se pudo forzar la devolución.",
    };
    res.redirect("/admin/orders");
  }
}

export default {
  getManageBooks,
  getForm,
  listUsers,
  getCreateUserForm,
  createUser,
  getUpdateUserForm,
  updateUser,
  deleteUser,
  reactivateUser,
  getManageOrders,
  getPendingOrders,
  getDashboard,
  updateOrderStatus,
  cancelOrder,
  getManageReviews,
  deleteReview,
  updateReview,
  getManagedGenres,
  createGenre,
  deleteGenre,
  restoreGenre,
  adminConfirmReturn,
  adminForceReturn,
  adminRejectReturn,
};
