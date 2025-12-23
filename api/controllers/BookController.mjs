import RepoBook from "../Repositories/BookRepository.mjs";

async function createBook(req, res) {
  // Controlador de creación de libro
  try {
    const book = await RepoBook.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el libro" });
  }
}

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

async function updateBook(req, res) {
  // Controlador de actualización de libro
  try {
    const update_data = { id: req.params.id, ...req.body }; // Crea un objeto que añade el id al resto de parámetros del body
    const book = await RepoBook.updateBook(update_data);
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el libro" });
  }
}

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

export default {
  createBook,
  getBookById,
  getBookByTitle,
  updateBook,
  deleteBook,
  getBookByFeatures,
  updateAllCovers,
  getAllBooks,
};
