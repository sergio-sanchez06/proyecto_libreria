// web/controllers/genresController.mjs
import apiClient from "../utils/apiClient.mjs";
import { getAuthenticatedClient } from "../utils/apiClient.mjs"; // Asegúrate de importar esto
import redisController from "./RedisController.mjs";

let redisClient = null;

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getGenres(req, res) {
  try {
    const response = await apiClient.get("/genres/all");

    console.log("Generos: ", response.data);

    res.render("partials/genres", {
      genres: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    res
      .status(500)
      .render("error", { message: "Error al obtener los géneros" });
  }
  // try {
  //   const response = await apiClient.get("/genres");

  //   console.log("Generos: ", response.data.data);

  //   res.render("partials/genres", {
  //     genres: response.data.data,
  //     user: req.session.user || null,
  //   });
  // } catch (error) {
  //   res.status(500).send("Error al obtener los géneros");
  // }
}

async function getGenreBooksByGenreName(req, res) {
  const { genreName } = req.params;
  try {
    const genreResponse = await apiClient.get(`/genres/name/${genreName}`);

    const genreData = genreResponse.data;

    // 2. Validar si el género existe y si está activo
    // Comprobamos !genreData porque si la API no encuentra nada, suele devolver null o vacío
    if (!genreData || Object.keys(genreData).length === 0) {
      return res.status(404).render("errors/404", {
        message: "El género solicitado no existe.",
      });
    }

    if (genreData.deleted_at) {
      return res.status(404).render("errors/404", {
        message: "Este género ya no está disponible.",
      });
    }

    const response = await apiClient.get(`/bookGenre/genre/${genreName}`);
    console.log(response.data);
    console.log("Datos del género", genreData);
    res.render("partials/genre_detalle", {
      bookGenre: response.data || null,
      genreData: genreData || null,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error en getGenreBooksByGenreName:", error);
    // Si la API devuelve 404, Axios lo lanza al catch. Manejémoslo:
    if (error.response && error.response.status === 404) {
      return res
        .status(404)
        .render("errors/404", { message: "Género no encontrado" });
    }
    res.status(500).render("errors/500");
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateGenre(req, res) {
  // Verificación básica en el cliente antes de llamar a la API
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.redirect("/genres");
  }

  const formData = req.session.formData || null;
  delete req.session.formData;

  res.render("admin/add_genre", {
    user: req.session.user,
    genreData: formData,
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

    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género creado con éxito.",
    };

    res.redirect("/genres");
  } catch (error) {
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al crear el género.",
    };
    res.redirect("/admin/genres/create");
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

    const formData = req.session.formData || null;
    delete req.session.formData;

    const response = await apiClient.get(`/genres/${genreId}`);
    res.render("admin/edit_genre", {
      genre: formData
        ? { ...response.data, ...formData, id: genreId }
        : response.data,
      error: null,
      user: req.session.user,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).render("error", {
      message: "Error al cargar el formulario de edición",
    });
  }
}

async function updateGenre(req, res) {
  try {
    const id = req.body.id;
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/genres/${id}`, req.body);
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género actualizado correctamente.",
    };
    res.redirect("/genres");
  } catch (error) {
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message || "Error al actualizar el género.",
    };
    res.redirect(`/admin/genres/edit/${id}`);
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
    res.redirect("/admin/genres");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No se puede eliminar: el género podría estar en uso.",
    };
    res.redirect("/genres");
  }
}

async function restoreGenre(req, res) {
  try {
    const id = req.body.id;
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/genres/restore/${id}`);
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllGenres");

    req.session.flash = {
      type: "success",
      message: "Género restaurado correctamente.",
    };
    res.redirect("/admin/genres");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al restaurar el género.",
    };
    res.redirect("/genres");
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
  restoreGenre,
};
