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

async function listUsers(req, res) {
  try {
    const response = await apiClient.get("/users", {
      headers: { Authorization: `Bearer ${req.session.idToken}` },
    });

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
    const api = getAuthenticatedClient(req.session.idToken);
    const response = await api.delete(`/users/${req.params.id}`);
    const user = response.data;
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).send("Error al eliminar usuario");
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
};
