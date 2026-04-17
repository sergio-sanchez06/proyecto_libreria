import { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redis from "../controllers/RedisController.mjs";

async function getProfile(req, res) {
  // 1. Verificación de seguridad en el controlador web
  if (!req.session.user || !req.session.idToken) {
    console.log("Sesión no encontrada o token ausente");
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

    const api = getAuthenticatedClient(cleanToken);

    const response = await api.get("/users/me/" + req.session.user.id);

    res.render("partials/perfil", {
      user: req.session.user,
      profile: response.data,
      error: null,
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

    res.render("perfil", {
      user: req.session.user,
      profile: null,
      error:
        "No se pudo conectar con el servidor para cargar tus datos detallados.",
    });
  }
}

async function getPurchaseHistory(req, res) {
  console.log(
    "Hemos entrado al controlador de mis compras - Versión Optimizada",
  );

  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    var userOrder = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("AllUserOrders")
    console.log(redisData)
    if(redisData){
      userOrder = JSON.parse(redisData)
    }else{
      const response = await apiClient.get("/orders/user/" + req.session.user.id);
      userOrder = response.data;
      await redisClient.set("AllUserOrders", JSON.stringify(userOrder))
      
    }

    for (let order of userOrder) {
      const responseItems = await api.get("/orderItems/" + order.id);
      order.items = responseItems.data;
    }

    console.log("orders", userOrder);
    console.log("orders[0].items", userOrder[0].items);

    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: userOrder,
    });
  } catch (error) {
    console.error("Error en getPurchaseHistory:", error.message);
    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: [],
      error: "Error al cargar el historial de compras.",
    });
  }
}

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
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    console.log("Hemos entrado al controlador de actualizar perfil");
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    console.log(req.body);

    // 1. Obtener los datos del usuario
    const response = await api.put(
      "/users/profile/" + req.session.user.id,
      req.body,
    );
    const user = response.data.user;

    req.session.user = user;

    console.log(user);

    // 2. Renderizar la plantilla con los datos del usuario
    res.render("partials/perfil", {
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error en editProfile:", error.message);
    res.render("partials/editUserProfile", {
      user: null,
      error: "Error al cargar los datos del usuario.",
    });
  }
}

async function dismissSelf(req, res) {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    console.log("Hemos entrado al controlador de eliminar perfil");
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // 1. Obtener los datos del usuario
    const response = await api.delete("/users/dismissSelf/" + req.body.id);
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
    console.error("Error en editProfile:", error.message);
    res.render("partials/editUserProfile", {
      user: null,
      error: "Error al cargar los datos del usuario.",
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

    var userReviews = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("AllUserReviews" + req.session.user.id)
    if(redisData){
      userReviews = JSON.parse(redisData)
    }else{
      const response = await api.get("/review/user/" + req.session.user.id);
      userReviews = response.data;
      await redisClient.set("AllUserReviews" + req.session.user.id, JSON.stringify(userReviews))
      
    }

    console.log("reviews", userReviews);

    res.render("partials/myReviews", {
      title: "Mis reseñas",
      user: req.session.user,
      reviews: userReviews,
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

export default {
  getProfile,
  getPurchaseHistory,
  getEditProfileForm,
  updateProfile,
  dismissSelf,
  getMyReviews,
};
