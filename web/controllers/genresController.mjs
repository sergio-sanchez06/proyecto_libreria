// web/controllers/genresController.mjs
import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs"; // Asegúrate de importar esto

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getGenres(req, res) {
  try {
    const response = await apiClient.get("/genres");
    res.render("partials/genres", {
      genres: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(500).send("Error al obtener los géneros");
  }
}

async function getGenreBooksByGenreName(req, res) {
  const { genreName } = req.params;
  try {
    const response = await apiClient.get(`/bookGenre/genre/${genreName}`);
    const genreResponse = await apiClient.get(`/genres/name/${genreName}`);
    console.log(response.data);
    console.log(genreResponse.data);
    res.render("partials/genre_detalle", {
      bookGenre: response.data || null,
      genreData: genreResponse.data || null,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(500).send("Error al obtener libros del género");
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateGenre(req, res) {
  // Verificación básica en el cliente antes de llamar a la API
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/genres");
  }
  res.render("admin/add_genre", {
    user: req.session.user,
    error: null,
  });
}

async function createGenre(req, res) {
  try {
    // 1. Limpiamos el token para evitar el "Bearer Bearer"
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // 2. Llamada a la API
    await api.post("/genres", req.body);
    res.redirect("/genres");
  } catch (error) {
    res.render("admin/add_genre", {
      error: error.response?.data?.message || "Error al crear género",
      user: req.session.user,
    });
  }
}

async function getEditGenre(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/genres");
  }
  try {
    console.log(req.params.genreId);

    const genreId = req.params.genreId; // Usamos ID para ser consistentes con la API
    console.log(`Id del genero a editar: ${genreId}`);
    const response = await apiClient.get(`/genres/${genreId}`);
    res.render("admin/edit_genre", {
      genre: response.data,
      error: null,
      user: req.session.user,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).send("Error al cargar el formulario de edición");
  }
}

async function updateGenre(req, res) {
  try {
    const id = req.body.id;
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/genres/${id}`, req.body);
    res.redirect("/genres");
  } catch (error) {
    res.render("admin/edit_genre", {
      genre: { ...req.body, id: req.params.id },
      error: error.response?.data?.message || "Error al actualizar",
      user: req.session.user,
    });
  }
}

async function deleteGenre(req, res) {
  try {
    const id = req.body.id;
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/genres/${id}`);
    res.redirect("/genres/showAllGenres");
  } catch (error) {
    console.error("Error eliminando género:", error.response?.data);
    res.redirect("/genres?error=no_permitido");
  }
}

export default {
  getGenres,
  getGenreBooksByGenreName,
  getCreateGenre,
  createGenre,
  getEditGenre,
  updateGenre,
  deleteGenre,
};
