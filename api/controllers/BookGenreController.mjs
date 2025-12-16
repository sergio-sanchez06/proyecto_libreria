import BookGenreRepository from '../models/Repositories/BookGenreRepository.mjs'; 

async function addGenreToBook(req, res) {
  try {
    const relation = await BookGenreRepository.createBookGenre(req.body);
    res.status(201).json({
      message: "Género asignado al libro correctamente",
      data: relation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asignar el género al libro" });
  }
}

async function getGenresByBook(req, res) {
  try {
    const genres = await BookGenreRepository.getGenresByBookId(req.params.bookId);
    res.status(200).json(genres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los géneros del libro" });
  }
}

async function getBooksByGenre(req, res) {
  try {
    const books = await BookGenreRepository.getBooksByGenreId(req.params.genreId);
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros del género" });
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
  getGenresByBook,
  getBooksByGenre,
  removeGenreFromBook
};