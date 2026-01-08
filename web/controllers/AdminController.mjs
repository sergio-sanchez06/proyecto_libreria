import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs";

export const getManageBooks = (req, res) => {
  res.render("admin/libros", {
    title: "Gestión de Libros",
  });
};

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

    // 1. Pedimos los pedidos
    const response = await api.get("/orders");
    const orders = response.data;

    // 2. En lugar de un FOR con AWAIT, lanzamos todas las peticiones a la vez
    // Promise.all permite que el pooler de Supabase gestione la cola
    await Promise.all(
      orders.map(async (order) => {
        try {
          const resItems = await api.get("/orderItems/" + order.id);
          console.log(resItems.data);
          order.items = resItems.data;
        } catch (err) {
          order.items = []; // Evitamos que un error en un pedido rompa todo
        }
      })
    );

    // ... lógica de títulos de libros ...

    res.render("admin/orders", { orders });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    res.render("errors/500", { error: "No se pudieron cargar los pedidos" });
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
        "El ID del usuario es requerido en el cuerpo del formulario"
      );
    }

    const userId = req.body.id;
    const api = getAuthenticatedClient(req.session.idToken);

    // 2. IMPORTANTE: Pasa el ID en la URL de la API, no en el body
    // Esto coincidirá con tu router.post("/users/delete/:id", ...) o similar
    await api.delete(`/users/${userId}`);

    // 3. Si todo sale bien, refrescamos la lista
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al eliminar usuario:", error.message);
    // Es mejor redirigir con error que enviar un .send() para no romper la experiencia del admin
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
  getDashboard,
  updateOrderStatus,
  deleteOrder,
};
