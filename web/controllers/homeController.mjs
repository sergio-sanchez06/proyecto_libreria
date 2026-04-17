import axios from "axios";
import redis from "../controllers/RedisController.mjs";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

async function getBooksAndAuthors(req, res, next) {
  try {
    // const response = await apiClient.get("/books");
    // const authorsResponse = await apiClient.get("/authors");

    var book = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("AllBooks")

    if(redisData){
      books = JSON.parse(redisData)
    }else{
      const response = await apiClient.get("/books/carrusel");
      book = response.data;
      await redisClient.set("AllGenres", JSON.stringify(book))
      
    }  

    var author = null
    const redisDataAuthors = await redisClient.get("AllAuthors")
    if(redisDataAuthors){
      author = JSON.parse(redisDataAuthors)
    }else{
      const response = await apiClient.get("/authors");
      author = response.data;
      await redisClient.set("AllAuthors", JSON.stringify(author))
      
    } 

    var bookAuthor = null
    const redisDataBookAuthor = await redisClient.get("AllBookAuthors")
    if(redisDataBookAuthor){
      bookAuthor = JSON.parse(redisDataBookAuthor)
    }else{
      const response = await apiClient.get("/bookAuthor");
      bookAuthor = response.data;
      await redisClient.set("AllBookAuthors", JSON.stringify(bookAuthor))
      
    } 
    
    const responseBooksAuthorCount = await apiClient.get("/bookAuthor/count");

    const booksAuthorsCount = responseBooksAuthorCount.data;
    const books = book;
    const authors = author;
    const bookAuthors = bookAuthor;
    res.locals.bookAuthors = bookAuthors;
    res.locals.bookAuthorsCount = booksAuthorsCount;
    res.locals.books = books;
    res.locals.authors = authors;

    // console.log(res.locals.bookAuthors);
    // console.log(res.locals.bookAuthorsCount);
    // console.log(res.locals.books);
    // console.log(res.locals.authors);

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
  const response = await apiClient.get("/books/mostSold");
  const booksMostSold = response.data;

  const responseAuthors = await apiClient.get("/authors/authors/mostSold");
  const authorsMostSold = responseAuthors.data;

  const responsePublishers = await apiClient.get("/publishers/mostSold");
  const publishersMostSold = responsePublishers.data;

  const responseGenres = await apiClient.get("/genres/mostSold");
  const genresMostSold = responseGenres.data;

  console.log(res.locals.books);

  res.render("partials/index", {
    books: res.locals.books,
    booksMostSold,
    authors: res.locals.authors,
    authorsMostSold,
    publishersMostSold,
    genresMostSold,
    bookAuthors: res.locals.bookAuthors,
    user: req.session.user || null,
  });
}

async function getBookById(req, res) {
  try {
    const response = await apiClient.get(`/books/${req.params.id}`);
    const book = response.data;
    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${req.params.id}`,
    );
    const authors = authorsResponse.data;
    const genresResponse = await apiClient.get(
      `/bookGenre/book/${req.params.id}`,
    );
    const genres = genresResponse.data;
    console.log(genres);
    res.render("partials/libro_detalle", {
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
  console.log(res.locals.books);

  res.render("partials/publisher_detalle", {
    publisher: res.locals.publisher,
    books: res.locals.books,
    user: req.session.user || null,
  });
}

export default {
  getBooksAndAuthors,
  getBookById,
  index,
  getBooksByPublisherId,
  publisher,
};
