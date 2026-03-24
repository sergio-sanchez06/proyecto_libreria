// web/controllers/bookController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

// web/controllers/bookController.mjs

async function getAllBooks(req, res) {
  try {
    const page = req.query.page || 1;
    const q = req.query.q || "";
    const maxPrice = req.query.maxPrice || "";
    const genre = req.query.genre || "";
    const author = req.query.author || "";

    const [booksResponse, genresResponse, authorsResponse] = await Promise.all([
      apiClient.get(`/books`, {
        params: { page, q, maxPrice, genre, author },
      }),
      apiClient.get("/genres"),
      apiClient.get("/authors"),
    ]);

    res.render("partials/booksTable", {
      books: booksResponse.data.data,
      genres: genresResponse.data.data || genresResponse.data,
      authors: authorsResponse.data,
      currentPage: booksResponse.data.currentPage,
      totalPages: booksResponse.data.totalPages,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros: ", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

// web/controllers/bookController.mjs

async function showAllBooks(req, res) {
  try {
    const page = req.query.page || 1;
    const q = req.query.q || "";
    const maxPrice = req.query.maxPrice || "";
    const genre = req.query.genre || "";
    const author = req.query.author || "";

    const [booksResponse, genresResponse, authorsResponse] = await Promise.all([
      apiClient.get(`/books`, {
        params: { page, q, maxPrice, genre, author },
      }),
      apiClient.get("/genres"),
      apiClient.get("/authors"),
    ]);

    res.render("partials/booksTable", {
      books: booksResponse.data.data,
      genres: genresResponse.data,
      authors: authorsResponse.data,
      currentPage: booksResponse.data.currentPage,
      totalPages: booksResponse.data.totalPages,
      query: req.query,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros en partial: ", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const bookResponse = await apiClient.get(`/books/${id}`);

    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${bookResponse.data.id}`,
    );

    const genresResponse = await apiClient.get(
      `/bookGenre/book/${bookResponse.data.id}`,
    );

    const publisherResponse = await apiClient.get(
      `/publishers/${bookResponse.data.publisher_id}`,
    );

    const reviewsResponse = await apiClient.get(
      `/review/book/${bookResponse.data.id}`,
    );

    const book = bookResponse.data;
    const authors = authorsResponse.data;
    const genres = genresResponse.data;
    const publisher = publisherResponse.data;
    const reviews = reviewsResponse.data;
    console.log(reviews);
    res.render("partials/libro_detalle", {
      book,
      authors,
      genres,
      publisher,
      reviews,
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
      apiClient.get("/publishers/allPublishers"),
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
  const updateData = { ...req.body };

  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  } else {
    delete updateData.cover_url;
  }

  const normalizeIds = (field) => {
    const value = updateData[field];

    // Si el campo NO está en el body se envia undefined
    // DEVOLVEMOS UNDEFINED para que la API no borre ni generos ni autores asociados al libro
    if (value === undefined) return undefined;

    // Si el campo está pero vacío (depende de cómo envíe el form si desmarcas todo)
    if (!value || value.length === 0) return [];

    const array = Array.isArray(value) ? value : [value];
    return array.map((id) => parseInt(id, 10));
  };

  const finalPayload = {
    ...updateData,
    author_ids: normalizeIds("author_ids"),
    genre_ids: normalizeIds("genre_ids"),
  };

  // Limpieza para no enviar basura a la API
  if (finalPayload.author_ids === undefined) delete finalPayload.author_ids;
  if (finalPayload.genre_ids === undefined) delete finalPayload.genre_ids;

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // Enviamos a la API
    await api.put(`/books/${id}`, finalPayload);
    res.redirect(`/books/book/${id}`);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Error");
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
