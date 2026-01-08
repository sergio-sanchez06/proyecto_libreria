import RepoBook from "../Repositories/BookRepository.mjs";
import BookAuthor from "../Repositories/BookAuthorRepository.mjs";
import BookGenre from "../Repositories/BookGenreRepository.mjs";

async function createBook(req, res) {
  // Controlador de creación de libro
  const bookData = req.body;

  try {
    const newBook = await RepoBook.createBook(bookData);

    // Crea relaciones autores
    for (const authorId of bookData.author_ids || []) {
      await BookAuthor.createBookAuthor({
        book_id: newBook.id,
        author_id: authorId,
      });
    }

    // Crea relaciones géneros
    for (const genreId of bookData.genre_ids || []) {
      await BookGenre.createBookGenre({
        book_id: newBook.id,
        genre_id: genreId,
      });
    }

    const fullBook = await RepoBook.getBookById(newBook.id, {
      withRelations: true,
    });
    res.status(201).json(fullBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
// async function createBook(req, res) {
//   // Controlador de creación de libro
//   try {
//     const book = await RepoBook.createBook(req.body);
//     res.status(201).json(book);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error al crear el libro" });
//   }
// }

async function getBookById(req, res) {
  // Controlador de obtención de libro por ID
  try {
    const book = await RepoBook.getBookById(req.params.id);
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el libro" });
  }
}

async function getBookByTitle(req, res) {
  // Controlador de obtención de libro por título
  try {
    const book = await RepoBook.getBookByTitle(req.params.title);
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el libro" });
  }
}

async function getBooksByPublisherId(req, res) {
  try {
    const books = await RepoBook.getBooksByPublisherId(req.params.id);
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros" });
  }
}

async function updateBook(req, res) {
  // Controlador de actualización de libro
  const bookId = req.params.id;
  const updateData = req.body;

  console.log(updateData);

  try {
    // Actualiza campos básicos del libro
    await RepoBook.updateBook(bookId, updateData);

    // Actualiza autores si se enviaron
    if (updateData.author_ids !== undefined) {
      await BookAuthor.deleteByBookId(bookId); // borra antiguas
      for (const authorId of updateData.author_ids) {
        await BookAuthor.createBookAuthor({
          book_id: bookId,
          author_id: authorId,
        });
      }
    }

    // Actualiza géneros si se enviaron
    if (updateData.genre_ids !== undefined) {
      await BookGenre.deleteByBookId(bookId); // borra antiguas
      for (const genreId of updateData.genre_ids) {
        await BookGenre.createBookGenre({
          book_id: bookId,
          genre_id: genreId,
        });
      }
    }

    const updatedBook = await RepoBook.getBookById(bookId, {
      withRelations: true,
    });
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
// async function updateBook(req, res) {
//   // Controlador de actualización de libro
//   try {
//     const update_data = { id: req.params.id, ...req.body }; // Crea un objeto que añade el id al resto de parámetros del body
//     const book = await RepoBook.updateBook(update_data);
//     res.status(200).json(book);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error al actualizar el libro" });
//   }
// }

async function deleteBook(req, res) {
  // Controlador de eliminación de libro
  try {
    await RepoBook.deleteBook(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el libro" });
  }
}

async function getBookByFeatures(req, res) {
  // Controlador de obtención de libro por características
  try {
    const book = await RepoBook.getBookByFeatures(req.params.features);
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el libro" });
  }
}

async function updateAllCovers(req, res) {
  try {
    const updatedBooks = await RepoBook.updateAllCovers();

    res.status(200).json(updatedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la portada" });
  }
}

async function getAllBooks(req, res) {
  // Controlador de obtención de todos los libros
  try {
    const books = await RepoBook.getAllBooks();
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros" });
  }
}

async function getMostSoldBooks(req, res) {
  try {
    const books = await RepoBook.getBooksMostSold();
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los libros" });
  }
}

export default {
  createBook,
  getBookById,
  getBookByTitle,
  updateBook,
  deleteBook,
  getBookByFeatures,
  updateAllCovers,
  getBooksByPublisherId,
  getAllBooks,
  getMostSoldBooks,
};
