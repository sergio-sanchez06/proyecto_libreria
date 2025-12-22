import BookGenreRepository from "../Repositories/BookGenreRepository.mjs";

async function addGenreToBook(req, res) {
  try {
    const relation = await BookGenreRepository.createBookGenre(req.body);
    res.status(201).json({
      message: "Género asignado al libro correctamente",
      data: relation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asignar el género al libro" });
  }
}

async function getBooksGenresByGenre(req, res) {
  console.log(req.params.genreName);

  try {
    const books = await BookGenreRepository.getBookGenresByGenre(
      req.params.genreName
    );
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros del género" });
  }
}

async function getBookGenresByBook(req, res) {
  try {
    const bookGenres = await BookGenreRepository.getBookGenresByBook(
      req.params.bookTitle
    );
    res.status(200).json(bookGenres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los géneros del libro" });
  }
}

async function removeGenreFromBook(req, res) {
  try {
    const { bookId, genreId } = req.params;
    await BookGenreRepository.deleteBookGenre(bookId, genreId);
    res.status(200).json({ message: "Género quitado del libro correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el género del libro" });
  }
}

export default {
  addGenreToBook,
  getBooksGenresByGenre,
  getBookGenresByBook,
  removeGenreFromBook,
};
