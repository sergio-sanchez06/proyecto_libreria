// web/controllers/bookController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getAllBooks(req, res) {
  try {
    const response = await apiClient.get("/books");
    res.render("index", {
      books: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

async function showAllBooks(req, res) {
  try {
    const response = await apiClient.get("/books");
    res.render("partials/booksTable", {
      books: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const bookResponse = await apiClient.get(`/books/${id}`);

    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${bookResponse.data.id}`
    );

    const genresResponse = await apiClient.get(
      `/bookGenre/book/${bookResponse.data.id}`
    );

    const publisherResponse = await apiClient.get(
      `/publishers/${bookResponse.data.publisher_id}`
    );

    const book = bookResponse.data;
    const authors = authorsResponse.data;
    const genres = genresResponse.data;
    const publisher = publisherResponse.data;
    res.render("partials/libro_detalle", {
      book,
      authors,
      genres,
      publisher,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    // Cargamos autores, géneros y editoriales para los selects del formulario
    const [authors, genres, publishers] = await Promise.all([
      apiClient.get("/authors"),
      apiClient.get("/genres"),
      apiClient.get("/publishers"),
    ]);

    res.render("admin/add_book", {
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(500).send("Error al cargar datos para el formulario");
  }
}

async function createBook(req, res) {
  const bookData = req.body;

  if (req.file) {
    bookData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  console.log(bookData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/books", bookData);
    res.redirect("/books/showAllBooks");
  } catch (error) {
    console.log("Error al crear libro:", error);
    console.log(error);

    // Si falla, volvemos a cargar el formulario con el error
    res.render("admin/add_book", {
      error: error.response?.data?.message || "Error al crear libro",
      user: req.session.user,
    });
  }
}

async function getEditBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    const { id } = req.params;
    const [bookRes, authors, genres, publishers] = await Promise.all([
      apiClient.get(`/books/${id}`),
      apiClient.get("/authors"),
      apiClient.get("/genres"),
      apiClient.get("/publishers"),
    ]);

    res.render("admin/edit_book", {
      book: bookRes.data,
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

async function updateBook(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  console.log(updateData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/books/${id}`, updateData);
    res.redirect(`/books/book/${id}`);
  } catch (error) {
    res.status(500).send("Error al actualizar el libro");
  }
}

async function deleteBook(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/books/${req.body.id}`);
    res.redirect("/books/showAllBooks");
  } catch (error) {
    console.error("Error al eliminar libro:", error.response?.data);
    res.status(500).send("No se pudo eliminar el libro.");
  }
}

export default {
  getAllBooks,
  showAllBooks,
  getBookById,
  getCreateBook,
  createBook,
  getEditBook,
  updateBook,
  deleteBook,
};
