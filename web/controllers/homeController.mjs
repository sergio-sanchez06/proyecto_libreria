import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

async function getBooksAndAuthors(req, res, next) {
  try {
    // const response = await apiClient.get("/books");
    // const authorsResponse = await apiClient.get("/authors");
    const responseBooks = await apiClient.get("/books");
    const responseAuthors = await apiClient.get("/authors");
    const responseBookAuthors = await apiClient.get("/bookAuthor");
    const responseBooksAuthorCount = await apiClient.get("/bookAuthor/count");

    const booksAuthorsCount = responseBooksAuthorCount.data;
    const books = responseBooks.data;
    const authors = responseAuthors.data;
    const bookAuthors = responseBookAuthors.data;
    res.locals.bookAuthors = bookAuthors;
    res.locals.bookAuthorsCount = booksAuthorsCount;
    res.locals.books = books;
    res.locals.authors = authors;
    next();
  } catch (error) {
    res.locals.bookAuthors = [];
    res.locals.books = [];
    res.locals.authors = [];
    console.error("Error cargando libros destacados:", error);
    next();
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

async function index(req, res) {
  res.render("index", {
    books: res.locals.books,
    authors: res.locals.authors,
    bookAuthors: res.locals.bookAuthors,
    user: req.session.user || null,
  });
}

async function getBookById(req, res) {
  try {
    const response = await apiClient.get(`/books/${req.params.id}`);
    const book = response.data;
    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${req.params.id}`
    );
    const authors = authorsResponse.data;
    const genresResponse = await apiClient.get(
      `/bookGenre/book/${req.params.id}`
    );
    const genres = genresResponse.data;
    console.log(genres);
    res.render("libro_detalle", {
      book,
      authors,
      genres,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error cargando libro:", error);
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

async function publisher(req, res) {
  res.render("publisher_detalle", {
    publisher: res.locals.publisher,
    books: res.locals.books,
  });
}

export default {
  getBooksAndAuthors,
  getBookById,
  index,
  getBooksByPublisherId,
  publisher,
};
