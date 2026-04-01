// web/controllers/bookController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

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
      apiClient.get("/genres"), //Ruta paginada
      apiClient.get("/authors"),
    ]);

    res.render("partials/booksTable", {
      books: booksResponse.data.data,
      genres: genresResponse.data.data,
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
      // CORRECCIÓN: Igual que arriba, para evitar el error de .forEach
      genres: genresResponse.data.data,
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
    const [authors, genres, publishers] = await Promise.all([
      apiClient.get("/authors"),
      apiClient.get("/genres/all"), // CAMBIO: Pedimos todos los géneros (sin paginar)
      apiClient.get("/publishers/all"), // CAMBIO: Pedimos todas las editoriales
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

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/books", bookData);
    res.redirect("/books/showAllBooks?success=true");
  } catch (error) {
    console.error("Error al crear libro:", error);

    // RE-CARGA DE CATÁLOGOS para que los <select> de autores, generos y editoriales no fallen
    try {
      const [authors, genres, publishers] = await Promise.all([
        apiClient.get("/authors"),
        apiClient.get("/genres/all"),
        apiClient.get("/publishers/all"), // Rutas que muestran todos los datos sin paginar
      ]);

      res.render("admin/add_book", {
        authors: authors.data,
        genres: genres.data,
        publishers: publishers.data,
        user: req.session.user,
        bookData: req.body, // Enviamos los datos recibidos de vuelta para que no se pierdan
        error: error.response?.data?.message || "No se pudo crear el libro.",
        success: null,
      });
    } catch (fetchError) {
      res.status(500).send("Error crítico al recargar el formulario");
    }
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
      apiClient.get("/genres/all"), // Pedimos todos los géneros
      apiClient.get("/publishers/all"), // Pedimos todas las editoriales
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

  // 1. Manejo de la imagen
  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  } else {
    delete updateData.cover_url;
  }

  // 2. Normalización de IDs (Autores y Géneros)
  const normalizeIds = (field) => {
    const value = updateData[field];
    if (value === undefined) return undefined;
    if (!value || value.length === 0) return [];
    const array = Array.isArray(value) ? value : [value];
    return array.map((id) => parseInt(id, 10));
  };

  // 3. PROCESAMIENTO DEL AÑO (releashed_year)
  // Si viene vacío o es "0", lo enviamos como null a la API para mantener consistencia de los datos
  const yearValue =
    updateData.releashed_year && updateData.releashed_year.trim() !== ""
      ? parseInt(updateData.releashed_year, 10)
      : null;

  const finalPayload = {
    ...updateData,
    releashed_year: yearValue, // Asignamos el valor procesado del año
    author_ids: normalizeIds("author_ids"),
    genre_ids: normalizeIds("genre_ids"),
  };

  if (finalPayload.author_ids === undefined) delete finalPayload.author_ids;
  if (finalPayload.genre_ids === undefined) delete finalPayload.genre_ids;

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/books/${id}`, finalPayload);

    //Redireccionamos a la vista del libro con un parámetro de éxito para que se muestre el modal de exito

    res.redirect(`/books/book/${id}?success=true`);
  } catch (error) {
    console.error("Error:", error.message);

    // ERROR: En lugar de un .send(500), recargamos la vista de edición
    // pasando el error y los datos para que el modal se active.
    try {
      const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
      const api = getAuthenticatedClient(cleanToken);

      // Recargamos los datos para los selectores
      const [publishers, authors, genres] = await Promise.all([
        api.get("/publishers/allPublishers"),
        api.get("/authors"),
        api.get("/genres/all"),
      ]);

      res.render("admin/edit_book", {
        book: { id, ...finalPayload }, // Devolvemos los datos del formulario
        publishers: publishers.data,
        authors: authors.data,
        genres: genres.data,
        error:
          "No se pudo actualizar el libro: " + error.response?.data?.message ||
          error.message,
      });
    } catch (e) {
      res.status(500).send("Error crítico al recargar el formulario");
    }
  }
}

// async function updateBook(req, res) {
//   const { id } = req.params;
//   const updateData = { ...req.body };

//   if (req.file) {
//     updateData.cover_url = `/uploads/covers/${req.file.filename}`;
//   } else {
//     delete updateData.cover_url;
//   }

//   const normalizeIds = (field) => {
//     const value = updateData[field];
//     if (value === undefined) return undefined;
//     if (!value || value.length === 0) return [];

//     const array = Array.isArray(value) ? value : [value];
//     return array.map((id) => parseInt(id, 10));
//   };

//   const finalPayload = {
//     ...updateData,
//     author_ids: normalizeIds("author_ids"),
//     genre_ids: normalizeIds("genre_ids"),
//   };

//   if (finalPayload.author_ids === undefined) delete finalPayload.author_ids;
//   if (finalPayload.genre_ids === undefined) delete finalPayload.genre_ids;

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     await api.put(`/books/${id}`, finalPayload);
//     res.redirect(`/books/book/${id}`);
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).send("Error al actualizar libro");
//   }
// }

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
