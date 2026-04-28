// web/controllers/bookController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redisController from "./RedisController.mjs";

import { getBookFormData } from "../utils/bookFormData.mjs";

let redisClient = null;

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
    // Definimos el cliente de redis
    redisClient = await redisController.returnRedisClient();

    const page = req.query.page || 1;
    const q = req.query.q || "";
    const maxPrice = req.query.maxPrice || "";
    const genre = req.query.genre || "";
    const author = req.query.author || "";

    const [cachedGenres, cachedAuthors] = await Promise.all([
      redisClient.get("AllGenres"),
      redisClient.get("AllAuthors"),
    ]);

    let genres = cachedGenres ? JSON.parse(cachedGenres) : null;
    let authors = cachedAuthors ? JSON.parse(cachedAuthors) : null;

    if (!genres || !authors) {
      const [genresResponse, authorsResponse] = await Promise.all([
        apiClient.get("/genres/all"),
        apiClient.get("/authors", {
          params: { onlyWithBooks: true },
        }),
      ]);

      genres = genresResponse.data;
      authors = authorsResponse.data;

      await redisClient.set("AllGenres", JSON.stringify(genres), { EX: 3600 });
      await redisClient.set("AllAuthors", JSON.stringify(authors), {
        EX: 3600,
      });
    }

    console.log("Genres:", genres[0]);

    const booksResponse = await apiClient.get(`/books`, {
      params: { page, q, maxPrice, genre, author },
    });

    res.render("partials/booksTable", {
      books: booksResponse.data.data,
      // CORRECCIÓN: Igual que arriba, para evitar el error de .forEach
      genres: genres,
      authors: authors,
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

    console.log(bookResponse.data);

    if (!bookResponse.data || !bookResponse.data.id) {
      return res.status(404).render("errors/404", {
        message: "El libro no existe o ha sido descatalogado.",
      });
    }

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

    // console.log(authors);

    res.render("partials/libro_detalle", {
      book,
      authors,
      genres,
      publisher,
      reviews,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("errors/404", { message: "Libro no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    const formData = req.session.formData || null;
    delete req.session.formData;

    const [authors, genres, publishers] = await Promise.all([
      apiClient.get("/authors", {
        params: {
          deleted: false, // No queremos los de la papelera
          onlyWithBooks: false, // Queremos TODOS los activos (tengan libros previos o no)
        },
      }),
      apiClient.get("/genres/all"), // CAMBIO: Pedimos todos los géneros (sin paginar)
      apiClient.get("/publishers/all"), // CAMBIO: Pedimos todas las editoriales
    ]);

    res.render("admin/add_book", {
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
      error: null,
      bookData: formData,
    });
  } catch (error) {
    res.status(500).send("Error al cargar datos para el formulario");
  }
}

async function createBook(req, res) {
  const bookData = { ...req.body };

  if (req.file) {
    bookData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    console.log(bookData);

    await api.post("/books", bookData);

    // MODAL ÉXITO
    req.session.flash = {
      type: "success",
      message: "¡Libro creado correctamente en el catálogo!",
    };
    res.redirect("/admin/books/list");
  } catch (error) {
    // PERSISTENCIA Y MODAL ERROR
    req.session.formData = req.body; // Guardamos lo que escribió el usuario
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No se pudo crear el libro. Revisa los datos.",
    };
    res.redirect("/admin/books/create");
  }
}

// async function createBook(req, res) {
//   const bookData = req.body; // YA ESTÁ LIMPIO Y TIPADO

//   if (req.file) {
//     bookData.cover_url = `/uploads/covers/${req.file.filename}`;
//   }

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     await api.post("/books", bookData);
//     res.redirect("/books/showAllBooks?success=true");
//   } catch (error) {
//     // Si la API falla (ej: ISBN duplicado en BD), recargamos usando el util
//     const extraData = await getBookFormData(req);
//     res.render("admin/add_book", {
//       ...extraData,
//       bookData: req.body,
//       error: error.response?.data?.message || "Error en la base de datos",
//     });
//   }
// }
// async function createBook(req, res) {
//   const bookData = req.body;

//   if (req.file) {
//     bookData.cover_url = `/uploads/covers/${req.file.filename}`;
//   }

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     await api.post("/books", bookData);
//     res.redirect("/books/showAllBooks?success=true");
//   } catch (error) {
//     console.error("Error al crear libro:", error);

//     // RE-CARGA DE CATÁLOGOS para que los <select> de autores, generos y editoriales no fallen
//     try {
//       const [authors, genres, publishers] = await Promise.all([
//         apiClient.get("/authors"),
//         apiClient.get("/genres/all"),
//         apiClient.get("/publishers/all"), // Rutas que muestran todos los datos sin paginar
//       ]);

//       res.render("admin/add_book", {
//         authors: authors.data,
//         genres: genres.data,
//         publishers: publishers.data,
//         user: req.session.user,
//         bookData: req.body, // Enviamos los datos recibidos de vuelta para que no se pierdan
//         error: error.response?.data?.message || "No se pudo crear el libro.",
//         success: null,
//       });
//     } catch (fetchError) {
//       res.status(500).send("Error crítico al recargar el formulario");
//     }
//   }
// }

async function getEditBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    const { id } = req.params;

    // PERSISTENCIA: Si venimos de un fallo de actualización, recuperamos los cambios
    const formData = req.session.formData || null;
    delete req.session.formData;

    const [bookRes, authors, genres, publishers] = await Promise.all([
      apiClient.get(`/books/${id}`),
      apiClient.get("/authors", {
        params: { deleted: false, onlyWithBooks: false },
      }),
      apiClient.get("/genres/all"),
      apiClient.get("/publishers/all"),
    ]);

    res.render("admin/edit_book", {
      // Priorizamos los datos de la sesión (lo que el usuario intentó corregir) sobre los de la BD
      book: formData ? { ...formData, id } : bookRes.data,
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

// async function getEditBook(req, res) {
//   if (!req.session.user || req.session.user.role !== "ADMIN")
//     return res.redirect("/");

//   try {
//     const { id } = req.params;
//     const [bookRes, authors, genres, publishers] = await Promise.all([
//       apiClient.get(`/books/${id}`),
//       apiClient.get("/authors", {
//         params: {
//           deleted: false, // No queremos los de la papelera
//           onlyWithBooks: false, // Queremos TODOS los activos (tengan libros previos o no)
//         },
//       }),
//       apiClient.get("/genres/all"), // Pedimos todos los géneros
//       apiClient.get("/publishers/all"), // Pedimos todas las editoriales
//     ]);

//     res.render("admin/edit_book", {
//       book: bookRes.data,
//       authors: authors.data,
//       genres: genres.data,
//       publishers: publishers.data,
//       user: req.session.user,
//       error: null,
//     });
//   } catch (error) {
//     res.status(404).render("error", { message: "Libro no encontrado" });
//   }
// }

async function updateBook(req, res) {
  const { id } = req.params;
  // req.body YA VIENE NORMALIZADO por el Schema de Zod (ints, arrays, etc.)
  const updateData = { ...req.body };

  const finalPayload = Object.fromEntries(
    Object.entries(req.body).filter(
      ([key, value]) => value !== undefined && key !== "id",
    ),
  );

  // Manejo de la imagen (esto sigue siendo responsabilidad del controller)
  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // Enviamos los datos que Zod ya limpió
    await api.put(`/books/${id}`, finalPayload);

    req.session.flash = {
      type: "success",
      message: "Los cambios se han guardado correctamente.",
    };
    res.redirect(`/books/book/${id}`);
  } catch (error) {
    console.error("Error API:", error.response?.data || error.message);

    req.session.formData = req.body;
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message || "Error al actualizar la información.",
    };
    res.redirect(`/admin/books/update/${id}`);
  }
}
// async function updateBook(req, res) {
//   const { id } = req.params;
//   const updateData = { ...req.body };

//   // 1. Manejo de la imagen
//   if (req.file) {
//     updateData.cover_url = `/uploads/covers/${req.file.filename}`;
//   } else {
//     delete updateData.cover_url;
//   }

//   // 2. Normalización de IDs (Autores y Géneros)
//   const normalizeIds = (field) => {
//     const value = updateData[field];
//     if (value === undefined) return undefined;
//     if (!value || value.length === 0) return [];
//     const array = Array.isArray(value) ? value : [value];
//     return array.map((id) => parseInt(id, 10));
//   };

//   // 3. PROCESAMIENTO DEL AÑO (releashed_year)
//   // Si viene vacío o es "0", lo enviamos como null a la API para mantener consistencia de los datos
//   const yearValue =
//     updateData.releashed_year && updateData.releashed_year.trim() !== ""
//       ? parseInt(updateData.releashed_year, 10)
//       : null;

//   const finalPayload = {
//     ...updateData,
//     releashed_year: yearValue, // Asignamos el valor procesado del año
//     author_ids: normalizeIds("author_ids"),
//     genre_ids: normalizeIds("genre_ids"),
//   };

//   if (finalPayload.author_ids === undefined) delete finalPayload.author_ids;
//   if (finalPayload.genre_ids === undefined) delete finalPayload.genre_ids;

//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     await api.put(`/books/${id}`, finalPayload);

//     //Redireccionamos a la vista del libro con un parámetro de éxito para que se muestre el modal de exito

//     res.redirect(`/books/book/${id}?success=true`);
//   } catch (error) {
//     console.error("Error:", error.message);

//     // ERROR: En lugar de un .send(500), recargamos la vista de edición
//     // pasando el error y los datos para que el modal se active.
//     try {
//       const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//       const api = getAuthenticatedClient(cleanToken);

//       // Recargamos los datos para los selectores
//       const [publishers, authors, genres] = await Promise.all([
//         api.get("/publishers/allPublishers"),
//         api.get("/authors"),
//         api.get("/genres/all"),
//       ]);

//       res.render("admin/edit_book", {
//         book: { id, ...finalPayload }, // Devolvemos los datos del formulario
//         publishers: publishers.data,
//         authors: authors.data,
//         genres: genres.data,
//         error:
//           "No se pudo actualizar el libro: " + error.response?.data?.message ||
//           error.message,
//       });
//     } catch (e) {
//       res.status(500).send("Error crítico al recargar el formulario");
//     }
//   }
// }

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

    await api.delete(`/books/${req.params.id}`);
    req.session.flash = {
      type: "success",
      message: "Libro movido a la papelera.",
    };
    res.redirect("/admin/books/list");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: error.response?.data?.error || "No se pudo eliminar el libro.",
    };
    res.redirect("/admin/books/list");
  }
}

async function restoreBook(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    const { id } = req.params;

    // Intentamos la restauración en la API
    await api.put(`/books/restore/${id}`);

    req.session.flash = {
      type: "success",
      message: "Libro restaurado con éxito.",
    };
    res.redirect("/admin/books/list");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: error.response?.data?.error || "No se pudo restaurar el libro.",
    };
    res.redirect("/admin/books/list");
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
  restoreBook,
};
