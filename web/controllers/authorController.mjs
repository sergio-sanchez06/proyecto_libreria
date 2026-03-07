// web/controllers/authorController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getAuthors(req, res) {
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
}

async function getAuthorById(req, res) {
  try {
    const { id } = req.params;
    // Peticiones paralelas para optimizar carga
    const authorResponse = await apiClient.get(`/authors/${id}`);
    const booksResponse = await apiClient.get(
      `/bookAuthor/author/${authorResponse.data.name}`
    );

    const author = authorResponse.data;
    const books = booksResponse.data;

    res.render("partials/autor_detalle", {
      author,
      books,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(404).render("error", { message: "Autor no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/authors");
  res.render("admin/add_author", {
    user: req.session.user,
    error: null,
  });
}

async function createAuthor(req, res) {
  const authorData = req.body;

  if (req.file) {
    authorData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/authors", authorData);
    res.redirect("/authors/showAllAuthors");
  } catch (error) {
    res.render("admin/add_author", {
      error: error.response?.data?.message || "Error al crear autor",
      user: req.session.user,
    });
  }
}

async function getEditAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/authors/showAllAuthors");
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    res.render("admin/edit_author", {
      author: response.data,
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

  if (req.file) {
    updateData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  console.log(updateData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/authors/${id}`, updateData);
    res.redirect(`/author/${id}`);
  } catch (error) {
    res.render("admin/edit_author", {
      author: { ...req.body, id },
      error: error.response?.data?.message || "Error al actualizar autor",
      user: req.session.user,
    });
  }
}

async function deleteAuthor(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/authors/${req.params.id}`);
    res.redirect("/authors/showAllAuthors");
  } catch (error) {
    console.error("Error al eliminar autor:", error.response?.data);
    res
      .status(500)
      .send(
        "No se pudo eliminar el autor. Verifique si tiene libros vinculados."
      );
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
};
