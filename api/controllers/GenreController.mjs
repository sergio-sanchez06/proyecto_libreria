import GenreRepository from "../Repositories/GenreRepository";

async function createGenre(req, res) {
  try {
    const genre = await GenreRepository.createGenre(req.body);
    res.status(201).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el género" });
  }
}

async function getGenreById(req, res) {
  try {
    const genre = await GenreRepository.getGenreById(req.params.id);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el género" });
  }
}

async function getGenreByName(req, res) {
  try {
    const genre = await GenreRepository.getGenreByName(req.params.name);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el género" });
  }
}

async function getAllGenres(req, res) {
  try {
    const genres = await GenreRepository.getAllGenres();
    res.status(200).json(genres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los géneros" });
  }
}

async function updateGenre(req, res) {
  try {
    const genre = await GenreRepository.updateGenre(req.body);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el género" });
  }
}

async function deleteGenre(req, res) {
  try {
    const genre = await GenreRepository.deleteGenre(req.params.id);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el género" });
  }
}

async function getGenreByCountry(req, res) {
  try {
    const genre = await GenreRepository.getGenreByCountry(req.params.country);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el género" });
  }
}

export default {
  createGenre,
  getGenreById,
  getGenreByName,
  getAllGenres,
  updateGenre,
  deleteGenre,
  getGenreByCountry,
};
