import UserFavoriteGenresRepository from "../Repositories/UserFavoriteGenresRepository.mjs";

// GET /users/favorites/:userId
async function getFavoriteGenres(req, res) {
  try {
    const { userId } = req.params;
    const genres = await UserFavoriteGenresRepository.getAllFavoriteGenresByUserId(
      userId,
    );
    res.status(200).json(genres);
  } catch (error) {
    console.error("Error en getFavoriteGenres:", error.message);
    res.status(500).json({ error: "Error al obtener géneros favoritos" });
  }
}

// POST /users/favorites/:userId — body: { genre_ids: [1, 3, 5] }
// Reemplaza todos los géneros favoritos del usuario de una vez
async function syncFavoriteGenres(req, res) {
  try {
    const { userId } = req.params;
    const { genre_ids } = req.body;

    if (!Array.isArray(genre_ids)) {
      return res.status(400).json({ error: "genre_ids debe ser un array" });
    }

    const updated = await UserFavoriteGenresRepository.syncFavoriteGenres(
      userId,
      genre_ids,
    );
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error en syncFavoriteGenres:", error.message);
    res.status(500).json({ error: "Error al sincronizar géneros favoritos" });
  }
}

// DELETE /users/favorites/:userId/:genreId — elimina un género favorito concreto
async function removeFavoriteGenre(req, res) {
  try {
    const { userId, genreId } = req.params;
    const updated = await UserFavoriteGenresRepository.removeFavoriteGenre(
      userId,
      genreId,
    );
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error en removeFavoriteGenre:", error.message);
    res.status(500).json({ error: "Error al eliminar género favorito" });
  }
}

export default {
  getFavoriteGenres,
  syncFavoriteGenres,
  removeFavoriteGenre,
};
