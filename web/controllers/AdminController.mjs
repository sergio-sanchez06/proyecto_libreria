import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs";

async function getManageBooks(req, res) {
  try {
    const page = req.query.page || 1;
    const q = req.query.q || "";
    const maxPrice = req.query.maxPrice || "";
    const genre = req.query.genre || "";
    const author = req.query.author || "";
    const deleted = req.query.deleted || "false";

    const [booksResponse, genresResponse, authorsResponse] = await Promise.all([
      apiClient.get(`/books`, {
        params: { page, q, maxPrice, genre, author, deleted },
      }),
      apiClient.get("/genres"), //Ruta paginada
      apiClient.get("/authors"),
    ]);

    res.render("admin/books_list", {
      books: booksResponse.data.data,
      genres: genresResponse.data.data,
      authors: authorsResponse.data,
      currentPage: booksResponse.data.currentPage,
      totalPages: booksResponse.data.totalPages,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros: ", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
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
    const pageOrders = allOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

    res.render("admin/orders", {
      orders: pageOrders,
      totalOrders: allOrders.length,
      currentPage,
      totalPages,
      lang: req.session.lang,
      isPending: false,
    });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    res.render("errors/500", { error: "No se pudieron cargar los pedidos" });
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
    const pageOrders = pendingOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

    res.render("admin/orders", {
      orders: pageOrders,
      totalOrders: pendingOrders.length,
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
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/users");

    res.render("admin/users_list", {
      users: response.data,
      message: req.query.msg || null,
    });
  } catch (error) {
    res.render("errors/500", { error: "No se pudieron cargar los usuarios" });
  }
}

async function getCreateUserForm(req, res) {
  res.render("admin/add_user", {
    title: "Agregar Usuario",
    user: req.session.user,
    error: req.query.error,
  });
}

async function createUser(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    console.log(req.session.idToken);
    const response = await api.post("/users", req.body);
    const user = response.data;
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).send("Error al crear usuario");
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
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.put(`/users/${req.params.id}`, req.body);
    const user = response.data;
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).send("Error al actualizar usuario");
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

    const userId = req.body.id;
    const api = getAuthenticatedClient(req.session.idToken);

    await api.delete(`/users/${userId}`);

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    res.redirect("/admin/users?error=No se pudo eliminar");
  }
}

async function getDashboard(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/login");
  }

  const api = getAuthenticatedClient(req.session.idToken);
  const response = await api.get("/users");
  const users = response.data.length;

  const responseOrders = await api.get("/orders");
  const orders = responseOrders.data.length;

  res.render("admin/dashboard", {
    title: "Consola de Administración",
    user: req.session.user,
    users: users,
    orders: orders,
  });
}

async function updateOrderStatus(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.put(`/orders/${req.body.orderId}`, req.body);
    const order = response.data;
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    res.status(500).send("Error al actualizar estado del pedido");
  }
}

async function deleteOrder(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.delete(`/orders/${req.body.orderId}`);
    const order = response.data;
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    res.status(500).send("Error al eliminar pedido");
  }
}

async function getManageReviews(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.get("/review/all");
    const reviews = response.data;
    console.log(reviews);
    res.render("admin/reviewsTable", {
      reviews: reviews,
      message: req.query.msg || null,
    });
  } catch (error) {
    console.error("Error al cargar reseñas:", error);
    res.render("errors/500", { error: "No se pudieron cargar las reseñas" });
  }
}

async function deleteReview(req, res) {
  console.log(req.params.id);
  console.log(req.session.user.id);

  try {
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.delete(`/review/admin/delete/${req.params.id}`);
    const review = response.data;
    res.redirect("/admin/reviews");
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    res.status(500).send("Error al eliminar reseña");
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
    res.redirect("/admin/reviews");
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    res.status(500).send("Error al actualizar reseña");
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
  getManageOrders,
  getPendingOrders,
  getDashboard,
  updateOrderStatus,
  deleteOrder,
  getManageReviews,
  deleteReview,
  updateReview,
};
