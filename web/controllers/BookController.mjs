// web/controllers/BookController.mjs
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

async function list(req, res) {
  try {
    const response = await apiClient.get("/books");
    const books = response.data;

    res.render("books/list", { books, user: req.session.user || null });
  } catch (error) {
    console.error("Error cargando libros:", error);
    res.render("books/list", { books: [], user: req.session.user || null });
  }
}

async function detail(req, res) {
  const bookId = req.params.id;

  try {
    const response = await apiClient.get(`/books/${bookId}`);
    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${bookId}`
    );
    const genresResponse = await apiClient.get(`/bookGenre/book/${bookId}`);
    const book = response.data;
    const authors = authorsResponse.data;
    const genres = genresResponse.data;

    res.render("books/detail", {
      book,
      authors,
      genres,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

export const createForm = (req, res) => {
  res.render("books/create", { error: null, user: req.session.user || null });
};

export const create = async (req, res) => {
  const bookData = req.body;

  if (req.file) {
    bookData.cover_url = `/img/covers/${req.file.filename}`;
  }

  try {
    await apiClient.post("/books", bookData);
    res.redirect("/books");
  } catch (error) {
    res.render("books/create", {
      error: "Error al crear libro",
      user: req.session.user || null,
    });
  }
};

async function getEdit(req, res) {
  const bookId = req.params.id;

  try {
    const response = await apiClient.get(`/books/${bookId}`);
    const book = response.data;

    console.log(book);

    res.render("bookEdit", {
      book,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

async function update(req, res) {
  const bookId = req.params.id;
  const updateData = req.body;

  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  try {
    console.log(updateData);
    await apiClient.put(`/books/${bookId}`, updateData);

    res.redirect(`/book/${bookId}`);
  } catch (error) {
    console.error("Error al actualizar libro:", error);

    try {
      const response = await apiClient.get(`/books/${bookId}`);
      const book = response.data;

      res.render("books/edit", {
        book,
        error: error.response?.data?.message || "Error al actualizar el libro",
      });
    } catch (fetchError) {
      res
        .status(500)
        .render("error", { message: "Error crítico al actualizar" });
    }
  }
}

async function remove(req, res) {
  const bookId = req.params.id;

  try {
    await apiClient.delete(`/books/${bookId}`);
    res.redirect("/books");
  } catch (error) {
    res.status(500).render("error", { message: "Error al eliminar libro" });
  }
}

async function getLibroDetail(req, res) {
  const bookId = req.params.id;

  try {
    const response = await apiClient.get(`/books/${bookId}`);
    const book = response.data;

    console.log(book);

    res.render("libro_detalle", {
      book,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

async function getCreate(req, res) {
  res.render("books/create", { error: null, user: req.session.user || null });
}

async function getDelete(req, res) {
  const bookId = req.params.id;

  try {
    const response = await apiClient.get(`/books/${bookId}`);
    const book = response.data;

    console.log(book);

    res.render("libro_detalle", {
      book,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

export default {
  list,
  detail,
  getLibroDetail,
  getCreate,
  getEdit,
  update,
  remove,
  create,
  getDelete,
};
