<<<<<<< HEAD
class UserController {
  constructor() {
    this.apiUrl = "http://localhost:3000/users";
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Obtener un usuario por su ID
  async getUserById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  async createUser(userData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Actualizar un usuario existente
  async updateUser(id, userData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Renderizar usuarios en el contenedor especificado
  async renderUsers(containerId = "user-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const users = await this.getAllUsers();
      container.innerHTML = "";

      if (users.length === 0) {
        container.innerHTML = "<p>No users found.</p>";
        return;
      }

      users.forEach((user) => {
        const div = document.createElement("div");
        div.className = "user-card";
        div.innerHTML = `
                    <h3>${user.name}</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role || "User"}</p>
                    <div class="actions">
                        <button onclick="window.editUser(${
                          user.id
                        })">Edit</button>
                        <button onclick="window.deleteUser(${
                          user.id
                        })">Delete</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading users.</p>";
    }
  }
}

export default new UserController();
=======
import { getAuthenticatedClient } from "../utils/apiClient.mjs";

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

    const response = await api.get("/orders/user/" + req.session.user.id);
    const orders = response.data;

    for (let order of orders) {
      const responseItems = await api.get("/orderItems/" + order.id);
      order.items = responseItems.data;
    }

    console.log("orders", orders);
    console.log("orders[0].items", orders[0].items);

    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: orders,
      lang: req.session.lang,
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

export default {
  getProfile,
  getPurchaseHistory,
  getEditProfileForm,
  updateProfile,
  dismissSelf,
};
>>>>>>> api
