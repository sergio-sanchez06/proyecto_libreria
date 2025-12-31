import { getAuthenticatedClient } from "../utils/apiClient.mjs";

export const getProfile = async (req, res) => {
  // 1. Verificación de seguridad en el controlador web
  if (!req.session.user || !req.session.idToken) {
    console.log("Sesión no encontrada o token ausente");
    return res.redirect("/login");
  }

  try {
    // 2. Limpieza preventiva: Si por error guardaste el token con "Bearer " en la sesión,
    // lo limpiamos para que getAuthenticatedClient no lo duplique.
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

    // 3. Creamos el cliente de Axios configurado con el Token
    const api = getAuthenticatedClient(cleanToken);

    // 4. Petición a la API (Consumo Indirecto)
    const response = await api.get("/users/me");

    // 5. Renderizamos con los datos frescos de la base de datos (profileData)
    // que vendrán de tus 3 tablas (usuario, direcciones, roles)
    res.render("perfil", {
      user: req.session.user, // Datos de sesión
      profile: response.data, // Datos reales de la DB local
      error: null,
    });
  } catch (error) {
    console.error(
      "Error en getProfile (Web):",
      error.response?.data || error.message
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
