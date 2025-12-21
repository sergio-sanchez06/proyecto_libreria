import BookAuthorRepository from '../Repositories/BookAuthorRepository.mjs';

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
    const books = await BookAuthorRepository.getBooksByAuthorName(req.params.authorName);
    console.log(books)
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros del autor" });
  }
}

async function updateBookAuthor(req, res) {
  try {
    const oldIds = {
      book_id: req.params.bookId,
      author_id: req.params.authorId
    };
    const newIds = {
      book_id: req.body.book_id,
      author_id: req.body.author_id
    };

    const updated = await BookAuthorRepository.updateBookAuthor(oldIds, newIds);

    if (!updated) {
      return res.status(404).json({ error: "No se encontró el vínculo original para actualizar" });
    }

    res.status(200).json({ message: "Vínculo actualizado", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el vínculo" });
  }
}

async function removeAuthorFromBook(req, res) {
  try {
    const { bookId, authorId } = req.params;
    const deleted = await BookAuthorRepository.deleteBookAuthor(bookId, authorId);

    if (!deleted) {
      return res.status(404).json({ error: "No se encontró el vínculo para eliminar" });
    }

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
  updateBookAuthor, // Añadido
  removeAuthorFromBook
};