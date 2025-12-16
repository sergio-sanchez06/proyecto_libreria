import BookAuthorRepository from '../models/Repositories/BookAuthorModel.mjs';

async function assignAuthorToBook(req, res) {
  try {
    const relation = await BookAuthorRepository.createBookAuthor(req.body);
    res.status(201).json({
      message: "Autor vinculado al libro exitosamente",
      data: relation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al vincular el autor al libro" });
  }
}

async function getAuthorsByBook(req, res) {
  try {
    const authors = await BookAuthorRepository.getAuthorsByBookId(req.params.bookId);
    res.status(200).json(authors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los autores del libro" });
  }
}

async function getBooksByAuthor(req, res) {
  try {
    const books = await BookAuthorRepository.getBooksByAuthorId(req.params.authorId);
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros del autor" });
  }
}

async function removeAuthorFromBook(req, res) {
  try {
    const { bookId, authorId } = req.params;
    await BookAuthorRepository.deleteBookAuthor(bookId, authorId);
    res.status(200).json({ message: "Vínculo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el vínculo" });
  }
}

export default {
  assignAuthorToBook,
  getAuthorsByBook,
  getBooksByAuthor,
  removeAuthorFromBook
};