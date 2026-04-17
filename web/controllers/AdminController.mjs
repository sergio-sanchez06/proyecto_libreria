import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redis from "../controllers/RedisController.mjs";

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
    var orders = null
    const api = getAuthenticatedClient(req.session.idToken);
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("AllOrders")

    // 1. Pedimos los pedidos comprobando la cache en redis
    if(!redisData){
      const response = await api.get("/orders");
      orders = response.data;
      await redisClient.set("AllOrders",JSON.stringify(orders))
    }else{
      orders = JSON.parse(redisData)
    }

    
   

    const batchSize = 5; // Límite de seguridad para el pool
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (order) => {
          try {
            const resItems = await api.get("/orderItems/" + order.id);
            order.items = resItems.data; // Aquí se inyectan los OrderItem
          } catch (err) {
            order.items = [];
          }
        }),
      );
    }

    // 2. En lugar de un FOR con AWAIT, lanzamos todas las peticiones a la vez
    // Promise.all permite que el pooler de Supabase gestione la cola
    // await Promise.all(
    //   orders.map(async (order) => {
    //     try {
    //       const resItems = await api.get("/orderItems/" + order.id);
    //       console.log(resItems.data);
    //       order.items = resItems.data;
    //     } catch (err) {
    //       order.items = []; // Evitamos que un error en un pedido rompa todo
    //     }
    //   }),
    // );

    res.render("admin/orders", { orders, lang: req.session.lang });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    res.render("errors/500", { error: "No se pudieron cargar los pedidos" });
  }
}

async function listUsers(req, res) {
  try {
    const api = getAuthenticatedClient(req.session.idToken);
    var user = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("AllUser")

    if(!redisData){
      const response = await api.get("/users");
      user = response.data;
      await redisClient.set("AllUser",JSON.stringify(user))
    }else{
      user = JSON.parse(redisData)
    }

    res.render("admin/users_list", {
      users: user,
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

  var user = null
  const redisClient = redis.returnRedisClient()
  const redisData = await redisClient.get("AllUser")

  if(!redisData){
    const response = await api.get("/users");
    user = response.data;
    await redisClient.set("AllUser",JSON.stringify(user))
  }else{
    user = JSON.parse(redisData)
  }

  const users = user.length;


  var order = null
  const redisDataOrder = await redisClient.get("AllOrders")

  if(!redisDataOrder){
    const response = await api.get("/orders");
    order = response.data;
    await redisClient.set("AllOrders",JSON.stringify(order))
  }else{
    order = JSON.parse(redisData)
  }

  const orders = order.length;

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

    var reviews = null
    const redisData = await redisClient.get("AllReviews")

    if(!redisData){
      const response = await api.get("/review/all");
      reviews = response.data;
      await redisClient.set("AllReviews",JSON.stringify(reviews))
    }else{
      reviews = JSON.parse(redisData)
    }

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
  getDashboard,
  updateOrderStatus,
  deleteOrder,
  getManageReviews,
  deleteReview,
  updateReview,
};
