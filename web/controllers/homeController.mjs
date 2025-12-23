import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function getBooksAndAuthors(req, res) {
  try {
    const response = await apiClient.get("/books");
    const authorsResponse = await apiClient.get("/authors");
    const responseBookAuthors = await apiClient.get("/bookAuthor/count");
    const books = response.data;
    const authors = authorsResponse.data;
    const bookAuthors = responseBookAuthors.data;
    console.log(bookAuthors);
    res.render("index", { books, authors, bookAuthors });
  } catch (error) {
    console.error("Error cargando libros destacados:", error);
    res.render("index", { books: [] });
  }
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
    res.render("libro_detalle", { book, authors, genres });
  } catch (error) {
    console.error("Error cargando libro:", error);
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

export default {
  getBooksAndAuthors,
  getBookById,
};
