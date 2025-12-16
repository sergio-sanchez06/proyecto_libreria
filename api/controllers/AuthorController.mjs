import AuthorRepository from "../Repositories/AuthorRepository.mjs";

async function createAuthor(req, res) {
  // Controlador de creación de autor
  try {
    const author = await AuthorRepository.createAuthor(req.body);
    res.status(201).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el autor" });
  }
}

async function getAuthorById(req, res) {
  // Controlador de obtención de autor por ID
  try {
    const author = await AuthorRepository.getAuthorById(req.params.id);
    res.status(200).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el autor" });
  }
}

async function getAuthorByName(req, res) {
  // Controlador de obtención de autor por nombre
  try {
    const author = await AuthorRepository.getAuthorByName(req.params.name);
    res.status(200).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el autor" });
  }
}

async function getAuthorByCountry(req, res) {
  // Controlador de obtención de autor por país
  try {
    const author = await AuthorRepository.getAuthorByCountry(
      req.params.country
    );
    res.status(200).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el autor" });
  }
}

async function updateAuthor(req, res) {
  // Controlador de actualización de autor
  try {
    const update_data = { id: req.params.id, ...req.body }; // Crea un objeto que añade el id al resto de parámetros del body

    const author = await AuthorRepository.updateAuthor(update_data);
    res.status(200).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el autor" });
  }
}

async function deleteAuthor(req, res) {
  // Controlador de eliminación de autor
  try {
    const author = await AuthorRepository.deleteAuthor(req.params.id);
    res.status(200).json(author);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el autor" });
  }
}

async function getAllAuthors(req, res) {
  // Controlador de obtención de todos los autores
  try {
    const authors = await AuthorRepository.getAllAuthors();
    res.status(200).json(authors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los autores" });
  }
}

export default {
  createAuthor,
  getAuthorById,
  getAuthorByName,
  getAuthorByCountry,
  updateAuthor,
  deleteAuthor,
  getAllAuthors,
};
