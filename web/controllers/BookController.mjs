// web/controllers/BookController.mjs
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
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

    console.log(authorsResponse.data);

    res.render("libro_detalle", {
      book,
      authors: authorsResponse.data || null,
      genres,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

export const create = async (req, res) => {
  const bookData = req.body;

  if (req.file) {
    bookData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  // Asegura arrays
  bookData.author_ids = Array.isArray(bookData.author_ids)
    ? bookData.author_ids
    : [];
  bookData.genre_ids = Array.isArray(bookData.genre_ids)
    ? bookData.genre_ids
    : [];

  try {
    await apiClient.post("/books", bookData);
    res.redirect("/");
  } catch (error) {
    // Recarga formulario con error
    const [authorsRes, publishersRes, genresRes] = await Promise.all([
      apiClient.get("/authors"),
      apiClient.get("/publishers"),
      apiClient.get("/genres"),
    ]);

    res.render("admin/bookCreate", {
      authors: authorsRes.data,
      publishers: publishersRes.data,
      genres: genresRes.data,
      user: req.session.user || null,
      error: error.response?.data?.message || "Error al crear libro",
    });
  }
};

async function getCreate(req, res) {
  try {
    const [authorsResponse, publishersResponse, genresResponse] =
      await Promise.all([
        apiClient.get("/authors"),
        apiClient.get("/publishers"),
        apiClient.get("/genres"),
      ]);

    const authors = authorsResponse.data;
    const publishers = publishersResponse.data;
    const genres = genresResponse.data;

    res.render("admin/bookCreate", {
      authors,
      publishers,
      genres,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error cargando libros:", error);
    res.render("admin/bookCreate", {
      authors: [],
      publishers: [],
      genres: [],
      error: "Error al cargar libros",
      user: req.session.user || null,
    });
  }
}

async function getEdit(req, res) {
  const bookId = req.params.id;

  try {
    const bookResponse = await apiClient.get(`/books/${bookId}`);
    const book = bookResponse.data;

    // Carga listas para selects
    const [authorsResponse, publishersResponse, genresResponse] =
      await Promise.all([
        apiClient.get("/authors"),
        apiClient.get("/publishers"),
        apiClient.get("/genres"),
      ]);

    const authors = authorsResponse.data;
    const publishers = publishersResponse.data;
    const genres = genresResponse.data;

    res.render("bookEdit", {
      book,
      authors,
      publishers,
      genres,
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

  updateData.author_ids = req.body.author_ids;
  updateData.genre_ids = req.body.genre_ids;

  try {
    console.log(updateData);
    await apiClient.put(`/books/${bookId}`, updateData);

    res.redirect(`/book/${bookId}`);
  } catch (error) {
    console.error("Error al actualizar libro:", error);

    try {
      const response = await apiClient.get(`/books/${bookId}`);
      const book = response.data;

      res.redirect(`/books/edit/${bookId}`);
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
  // const bookId = req.params.id;

  // try {
  //   const response = await apiClient.get(`/books/${bookId}`);
  //   const book = response.data;

  //   console.log(book);

  //   res.render("libro_detalle", {
  //     book,
  //     error: null,
  //     user: req.session.user || null,
  //   });
  // } catch (error) {
  //   res.status(404).render("error", { message: "Libro no encontrado" });
  // }

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

    const publisherResponse = await apiClient.get(
      `/publishers/${book.publisher_id}`
    );
    const publisher = publisherResponse.data;

    console.log(authorsResponse.data);
    console.log(book);

    res.render("libro_detalle", {
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

async function getBooksByPublisherId(req, res, next) {
  try {
    const response = await apiClient.get(`/books/publisher/${req.params.id}`);
    const books = response.data;
    res.locals.books = books;
    next();
  } catch (error) {
    res.locals.books = [];
    console.error("Error cargando libros por editorial:", error);
    next();
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
  getBooksByPublisherId,
};
