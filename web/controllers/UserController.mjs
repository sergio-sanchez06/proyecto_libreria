import { getAuthenticatedClient } from "../utils/apiClient.mjs";

export const getProfile = async (req, res) => {
  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const api = getAuthenticatedClient(req.session.idToken);

    const response = await api.get("/users/me");

    const profileData = response.data;

    res.render("perfil", {
      user: req.session.user,
      profile: profileData,
    });
  } catch (error) {
    res.render("perfil", {
      user: req.session.user,
      error: "No se pudo cargar el perfil",
    });
  }
};

export const getPurchaseHistory = (req, res) => {
  res.render("historial_compras", {
    title: "Mis compras",
  });
};

export const getMyReviews = (req, res) => {
  res.render("mis_reseñas", {
    title: "Mis Reseñas",
  });
};

export default {
  getProfile,
  getPurchaseHistory,
  getMyReviews,
};
