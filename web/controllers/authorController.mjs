// web/controllers/authorController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

import redisController from "./RedisController.mjs";

let redisClient = null;

// --- FUNCIONES PÚBLICAS (Lectura) ---

/*async function getAuthors(req, res) {
  try {
    const response = await apiClient.get("/authors");
    res.render("partials/authorsTable", {
      authors: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener los autores:", error);
    res.status(500).send("Error al obtener los autores");
  }
}*/

async function getAuthors(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    const sort = req.query.sort
      ? Array.isArray(req.query.sort)
        ? req.query.sort
        : [req.query.sort]
      : [];

    const mostRated = sort.includes("mostRated");
    const leastRated = sort.includes("leastRated");
    const mostBought = sort.includes("mostBought");
    const leastBought = sort.includes("leastBought");

    const page = req.query.page || 1;
    const country = req.query.country || null;
    const limit = 4;

    // 1. Obtener países de Redis
    const cachedCountries = await redisClient.get("AllCountries");
    let countries = cachedCountries ? JSON.parse(cachedCountries) : null;

    // 2. Preparar las promesas
    // La petición de paises solo se ejecuta si no está en caché.
    const authorsPromise = apiClient.get(
      `/authors?page=${page}&limit=${limit}${country ? `&country=${country}` : ""}${mostRated ? `&mostRated=${mostRated}` : ""}${leastRated ? `&leastRated=${leastRated}` : ""}${leastBought ? `&leastBought=${leastBought}` : ""}${mostBought ? `&mostBought=${mostBought}` : ""}`,
    );

    const countriesPromise = countries
      ? Promise.resolve({ data: countries })
      : apiClient.get("/authors/countries");

    const [authorsRes, countriesRes] = await Promise.all([
      authorsPromise,
      countriesPromise,
    ]);

    if (!countries) {
      countries = countriesRes.data;
      await redisClient.set("AllCountries", JSON.stringify(countries), {
        EX: 3600,
      });
    }

    res.render("partials/authorsTable", {
      authors: authorsRes.data.data,
      currentPage: authorsRes.data.currentPage,
      totalPages: authorsRes.data.totalPages,
      countries: countriesRes.data,
      selectedCountry: country,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener los autores:", error);
    res
      .status(500)
      .render("error", { message: "Error al obtener los autores" });
  }
}

async function getAuthorById(req, res) {
  try {
    const { id } = req.params;
    // Peticiones paralelas para optimizar carga
    const authorResponse = await apiClient.get(`/authors/${id}`);

    const author = authorResponse.data;

    console.log(author);

    if (!author || !author.id) {
      return res
        .status(404)
        .render("errors/404", { message: "Autor no encontrado" });
    }

    const booksResponse = await apiClient.get(
      `/bookAuthor/author/${authorResponse.data.name}`,
    );

    const books = booksResponse.data;

    res.render("partials/autor_detalle", {
      author,
      books,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(404).render("errors/404", { message: "Autor no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.status(403).send("No tienes permiso para crear autores");
  }

  // PERSISTENCIA: Recuperamos datos de un intento fallido anterior
  const formData = req.session.formData || null;
  delete req.session.formData;

  res.render("admin/add_author", {
    user: req.session.user,
    error: null,
    authorData: formData,
  });
}

async function createAuthor(req, res) {
  const authorData = req.body;

  redisClient = await redisController.returnRedisClient();

  if (req.file) {
    authorData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);
    await api.post("/authors", authorData);

    await Promise.all([
      redisClient.del("AllAuthors"),
      redisClient.del("AllCountries"),
    ]);

    req.session.flash = {
      type: "success",
      message: "Autor añadido correctamente al sistema.",
    };
    res.redirect("/authors/manage/list");
  } catch (error) {
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "No se pudo crear el autor.",
    };
    res.redirect("/authors/create"); // Redirigimos al GET para mostrar errores
  }
}

async function getEditAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/authors/showAllAuthors");
  try {
    const { id } = req.params;

    const formData = req.session.formData || null;
    delete req.session.formData;

    const response = await apiClient.get(`/authors/${id}`);
    res.render("admin/edit_author", {
      author: formData
        ? {
            ...response.data,
            ...formData,
            id,
            photo_url: response.data.photo_url,
          }
        : response.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Autor no encontrado" });
  }
}

async function updateAuthor(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  redisClient = await redisController.returnRedisClient();

  if (req.file) {
    updateData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  console.log(updateData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/authors/${id}`, updateData);

    await Promise.all([
      redisClient.del("AllAuthors"),
      redisClient.del("AllCountries"),
    ]);

    req.session.flash = {
      type: "success",
      message: "Información del autor actualizada.",
    };
    res.redirect(`/author/${id}`);
  } catch (error) {
    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al actualizar autor",
    };
    res.redirect(`/authors/edit/${id}`);
  }
}

async function deleteAuthor(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/authors/${req.params.id}`);

    redisClient = await redisController.returnRedisClient();

    await Promise.all([
      redisClient.del("AllAuthors"),
      redisClient.del("AllCountries"),
    ]);

    req.session.flash = {
      type: "success",
      message: "Autor eliminado con éxito.",
    };
    res.redirect("/authors/manage/list");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "No se pudo eliminar el autor.",
    };
    res.redirect("/authors/manage/list");
  }
}

async function getManageAuthors(req, res) {
  try {
    redisClient = await redisController.returnRedisClient();

    const page = req.query.page || 1;
    const country = req.query.country || null;
    const deleted = req.query.deleted === "true";
    const includeAll = !deleted;

    const sort = req.query.sort
      ? Array.isArray(req.query.sort)
        ? req.query.sort
        : [req.query.sort]
      : [];

    const mostRated = sort.includes("mostRated");
    const leastRated = sort.includes("leastRated");
    const mostBought = sort.includes("mostBought");
    const leastBought = sort.includes("leastBought");
    const limit = 4;

    // 2. Intentar sacar países de caché
    const cachedCountries = await redisClient.get("AllCountries");
    let countries = cachedCountries ? JSON.parse(cachedCountries) : null;

    // 3. Lanzamos TODAS las peticiones en un solo Promise.all
    // Si countries ya existe, pasamos una promesa que resuelve a null inmediatamente
    const [authorsRes, countriesRes] = await Promise.all([
      apiClient.get(
        `/authors?page=${page}&limit=${limit}${country ? `&country=${country}` : ""}${deleted ? `&deleted=${deleted}` : ""}${mostRated ? `&mostRated=${mostRated}` : ""}${leastRated ? `&leastRated=${leastRated}` : ""}${leastBought ? `&leastBought=${leastBought}` : ""}${mostBought ? `&mostBought=${mostBought}` : ""}${includeAll ? `&includeAll=${includeAll}` : ""}`,
      ),
      countries ? Promise.resolve(null) : apiClient.get("/authors/countries"),
    ]);

    // 4. Si la API de países devolvió datos (porque no había caché), los guardamos
    if (!countries && countriesRes) {
      countries = countriesRes.data;
      await redisClient.set("AllCountries", JSON.stringify(countries), {
        EX: 3600,
      });
    }

    res.render("admin/authors_list", {
      authors: authorsRes.data.data,
      currentPage: authorsRes.data.currentPage,
      totalPages: authorsRes.data.totalPages,
      countries: countries,
      selectedCountry: country,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener los autores:", error);
    res
      .status(500)
      .render("error", { message: "Error al obtener los autores" });
  }
}

async function restoreAuthor(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/authors/restore/${req.params.id}`);

    redisClient = await redisController.returnRedisClient();

    await Promise.all([
      redisClient.del("AllAuthors"),
      redisClient.del("AllCountries"),
    ]);

    req.session.flash = {
      type: "success",
      message: "Autor restaurado correctamente.",
    };
    res.redirect("/authors/manage/list");
  } catch (error) {
    console.error("Error al restaurar autor:", error.response?.data);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al restaurar autor.",
    };
    res.redirect("/authors/manage/list");
  }
}

export default {
  getAuthorById,
  getEditAuthor,
  updateAuthor,
  deleteAuthor,
  createAuthor,
  getAuthors,
  getCreateAuthor,
  getManageAuthors,
  restoreAuthor,
};