import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
});

async function getGenres(req, res) {
  try {
    const response = await apiClient.get("/genres");

    res.render("genres", { genres: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener los géneros");
  }
}

async function getGenreBooksByGenreName(req, res) {
  let genre = req.params.genreName;
  try {
    const response = await apiClient.get("/bookGenre/genre/" + genre);
    res.render("genre_detalle", { bookGenre: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener los géneros");
  }
}

export default {
  getGenres,
  getGenreBooksByGenreName,
};
