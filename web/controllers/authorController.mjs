import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function getAuthorById(req, res) {
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    const author = response.data;
    const booksResponse = await apiClient.get(
      `/bookAuthor/author/${author.name}`
    );
    const books = booksResponse.data;
    console.log(books);
    // console.log(books);
    res.render("autor_detalle", { author, books, user: req.session.user });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(500).send("Error al obtener el autor");
  }
}

async function getEditAuthor(req, res) {
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    const author = response.data;
    res.render("editAuthor", { author });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(500).send("Error al obtener el autor");
  }
}

async function updateAuthor(req, res) {
  try {
    const { id } = req.params;
    const formData = new FormData();

    // Campos normales
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }

    // Archivo
    if (req.file) {
      formData.append(
        "author_photo",
        fs.createReadStream(req.file.path),
        req.file.originalname
      );
    }
    const response = await apiClient.put(`/authors/${id}`, formData, {
      headers: formData.getHeaders(),
    });

    // Borrar archivo temporal
    if (req.file) fs.unlinkSync(req.file.path);

    const author = response.data;

    res.redirect(`/author/${author.id}`);
  } catch (error) {
    console.error("Error al actualizar el autor:", error);
    res.status(500).send("Error al actualizar el autor");
  }
}

async function deleteAuthor(req, res) {
  try {
    const { id } = req.params;
    await apiClient.delete(`/authors/${id}`);
    res.redirect("/authors");
  } catch (error) {
    console.error("Error al eliminar el autor:", error);
    res.status(500).send("Error al eliminar el autor");
  }
}

async function getCreateAuthor(req, res) {
  try {
    res.render("admin/add_author", {
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(500).send("Error al obtener el autor");
  }
}

async function createAuthor(req, res) {
  console.log(req.body);

  const authorData = req.body;

  // Subida de foto (opcional)
  if (req.file) {
    authorData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  console.log(authorData);

  try {
    await apiClient.post("/authors", authorData);
    res.redirect("/"); // o página de listado
  } catch (error) {
    console.error("Error al crear el autor:", error);
    res.render("admin/add_author", {
      error: error.response?.data?.message || "Error al crear autor",
      user: req.session.user || null,
    });
  }
}

async function getAuthors(req, res) {
  try {
    const response = await apiClient.get("/authors");
    const authors = response.data;
    res.render("authors", { authors });
  } catch (error) {
    console.error("Error al obtener los autores:", error);
    res.status(500).send("Error al obtener los autores");
  }
}

async function editFormAuthor(req, res) {
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    const author = response.data;
    res.render("editAuthor", { author });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(500).send("Error al obtener el autor");
  }
}

export default {
  getAuthorById,
  getEditAuthor,
  updateAuthor,
  deleteAuthor,
  createAuthor,
  editFormAuthor,
  getAuthors,
  getCreateAuthor,
};
