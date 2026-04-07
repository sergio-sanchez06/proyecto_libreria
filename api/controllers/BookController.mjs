import RepoBook from "../Repositories/BookRepository.mjs";
import BookAuthor from "../Repositories/BookAuthorRepository.mjs";
import BookGenre from "../Repositories/BookGenreRepository.mjs";
import BookRepository from "../Repositories/BookRepository.mjs";

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

  const { id } = req.params;

  console.log("El id es: ", id  );

  try {
    const book = await RepoBook.getBookById(id);
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
  const bookId = req.params.id;
  const { author_ids, genre_ids, ...bookData } = req.body;

  try {
    // 1. Llamamos a una única función que se encarga de TODO en una transacción
    await RepoBook.updateBook(bookId, bookData, genre_ids, author_ids);

    // 2. Recuperamos el libro actualizado con sus nuevas relaciones
    const updatedBook = await RepoBook.getBookById(bookId);

    res.json(updatedBook);
  } catch (error) {
    console.error("Error actualizando libro:", error);
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

// async function getAllBooks(req, res) {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.page) || 10;

//     const result = await RepoBook.getAllBooks(page, limit);

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error al obtener los libros: ", error);
//     res.status(500).json({ error: "Error al obtener los libros"});
//   }
// }

async function getBooksCarrusel(req, res) {
  try {
    // Capturamos el string de la URL (?ids=1,2,3)
    const { ids } = req.query;

    // Se lo pasamos al método del repositorio
    const books = await RepoBook.getBooksCarrusel(ids);

    res.status(200).json(books);
  } catch (error) {
    console.error("Error en getBooksCarrusel:", error);
    res.status(500).json({ error: "Error al obtener los libros" });
  }
}

async function getAllBooks(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;

    const filters = {
      q: req.query.q || null,
      maxPrice: req.query.maxPrice || null,
      genre: req.query.genre || null,
      author: req.query.author || null,
      deleted: req.query.deleted || "false",
    };

    const result = await RepoBook.getAllBooks(page, filters);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener los libros en API Controller: ", error);
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

async function restoreBook(req, res) {
  try {
    const { id } = req.params;

    const result = await BookRepository.restoreBook(id);

    res.status(200).json({
      message: "Libro restaurado con éxito",
      ...result,
    });
  } catch (error) {
    console.error("Error en restoreBook (Controlador):", error.message);

    // Si el error es el que lanzamos en el servicio por la regla de negocio
    if (
      error.message.includes("archivada") ||
      error.message.includes("eliminada")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    // Error genérico para fallos de base de datos o conexión
    res.status(500).json({
      error: "Error interno al intentar restaurar el libro",
    });
  }
}
// async function restoreBook(req, res) {
//   try {
//     const { id } = req.params;

//     // Llamamos al servicio en lugar del repositorio
//     // Este método ya valida si la editorial está activa y maneja la transacción
//     const result = await PublisherBookService.restoreSingleBook(id);

//     res.status(200).json({
//       message: "Libro restaurado con éxito",
//       ...result,
//     });
//   } catch (error) {
//     console.error("Error en restoreBook (Controlador):", error.message);

//     // Si el error es el que lanzamos en el servicio por la regla de negocio
//     if (
//       error.message.includes("archivada") ||
//       error.message.includes("eliminada")
//     ) {
//       return res.status(400).json({
//         error: error.message,
//       });
//     }

//     // Error genérico para fallos de base de datos o conexión
//     res.status(500).json({
//       error: "Error interno al intentar restaurar el libro",
//     });
//   }
// }

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
  getBooksCarrusel,
  restoreBook,
};
