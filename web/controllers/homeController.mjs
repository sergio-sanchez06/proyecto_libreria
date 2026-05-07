// import axios from "axios";
import apiClient from "../utils/apiClient.mjs";
import redisController from "./RedisController.mjs";

// const apiClient = axios.create({
//   baseURL: "http://localhost:3000",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
// });

let redisClient = null;

async function getBooksAndAuthors(req, res, next) {
  try {
    // const response = await apiClient.get("/books");
    // const authorsResponse = await apiClient.get("/authors");
    const responseBooks = await apiClient.get("/books/carrusel");
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

    // console.log(res.locals.bookAuthors);
    // console.log(res.locals.bookAuthorsCount);
    // console.log(res.locals.books);
    // console.log(res.locals.authors);

    next();
  } catch (error) {
    console.log(error);

    res.render("errors/500", {
      message: "Error al cargar la página principal",
      stack: error.stack,
    });

    // res.locals.bookAuthors = [];
    // res.locals.books = [];
    // res.locals.authors = [];
    // console.error("Error cargando libros destacados:", error);
    // next();
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
  try {
    // 1. Inicializar cliente de Redis
    const redisClient = await redisController.returnRedisClient();

    // 2. Intentar obtener todas las listas de "Más vendidos" de Redis en paralelo
    const keys = [
      "BooksMostSold",
      "AuthorsMostSold",
      "PublishersMostSold",
      "GenresMostSold",
    ];
    const cachedData = await Promise.all(
      keys.map((key) => redisClient.get(key)),
    );

    // Mapeamos los resultados: si existe lo parseamos, si no, queda como null
    let [booksMostSold, authorsMostSold, publishersMostSold, genresMostSold] =
      cachedData.map((data) => (data ? JSON.parse(data) : null));

    // 3. Si falta algún dato en caché, pedimos a la API solo lo necesario
    if (
      !booksMostSold ||
      !authorsMostSold ||
      !publishersMostSold ||
      !genresMostSold
    ) {
      const apiCalls = [
        !booksMostSold
          ? apiClient.get("/books/mostSold")
          : Promise.resolve(null),
        !authorsMostSold
          ? apiClient.get("/authors/authors/mostSold")
          : Promise.resolve(null),
        !publishersMostSold
          ? apiClient.get("/publishers/mostSold")
          : Promise.resolve(null),
        !genresMostSold
          ? apiClient.get("/genres/mostSold")
          : Promise.resolve(null),
      ];

      const [resBooks, resAuthors, resPubs, resGenres] =
        await Promise.all(apiCalls);

      // 4. Guardamos en Redis lo que acabamos de pedir (TTL de 1 hora)
      if (resBooks) {
        booksMostSold = resBooks.data;
        await redisClient.set("BooksMostSold", JSON.stringify(booksMostSold), {
          EX: 3600,
        });
      }
      if (resAuthors) {
        authorsMostSold = resAuthors.data;
        await redisClient.set(
          "AuthorsMostSold",
          JSON.stringify(authorsMostSold),
          { EX: 3600 },
        );
      }
      if (resPubs) {
        publishersMostSold = resPubs.data;
        await redisClient.set(
          "PublishersMostSold",
          JSON.stringify(publishersMostSold),
          { EX: 3600 },
        );
      }
      if (resGenres) {
        genresMostSold = resGenres.data;
        await redisClient.set(
          "GenresMostSold",
          JSON.stringify(genresMostSold),
          { EX: 3600 },
        );
      }
    }

    // 5. Renderizado final
    res.render("partials/index", {
      books: res.locals.books,
      booksMostSold,
      authors: res.locals.authors,
      authorsMostSold,
      publishers: res.locals.publishers, // Asegúrate que este venga de tu middleware
      publishersMostSold,
      genresMostSold,
      bookAuthors: res.locals.bookAuthors,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error en el Home Index:", error);
    // Renderizamos con arrays vacíos si falla todo para que la web no se rompa
    res.render("partials/index", {
      books: [],
      booksMostSold: [],
      authors: [],
      authorsMostSold: [],
      publishersMostSold: [],
      genresMostSold: [],
      user: req.session.user || null,
    });
  }
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

//Inclusion de rutas a las vistas con información legal

function legalNotice(req, res) {
  res.render("legal/legal-notice");
}

function cookiesPolicy(req, res) {
  res.render("legal/cookies-policy");
}

function privacyPolicy(req, res) {
  res.render("legal/privacy-policy");
}

export default {
  getBooksAndAuthors,
  getBookById,
  index,
  getBooksByPublisherId,
  publisher,
  legalNotice,
  cookiesPolicy,
  privacyPolicy,
};
