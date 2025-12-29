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

async function getCreateGenre(req, res) {
  try {
    res.render("admin/add_genre", {
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    console.error("Error al obtener el género:", error);
    res.status(500).send("Error al obtener el género");
  }
}

async function createGenre(req, res) {
  const publisherData = req.body;

  // Subida de logo (opcional)
  if (req.file) {
    publisherData.logo_url = `/uploads/publishers/${req.file.filename}`;
  }

  try {
    await apiClient.post("/publishers", publisherData);
    res.redirect("/publishers"); // o página de listado
  } catch (error) {
    res.render("publishers/create", {
      error: error.response?.data?.message || "Error al crear editorial",
      user: req.session.user || null,
    });
  }
}

async function getEditGenre(req, res) {
  try {
    const { genreName } = req.params;
    const response = await apiClient.get(`/genres/${genreName}`);
    const genre = response.data;
    res.render("admin/edit_genre", {
      genre,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener el género:", error);
    res.status(500).send("Error al obtener el género");
  }
}

async function updateGenre(req, res) {
  const publisherId = req.params.id;
  const updateData = req.body;

  // Subida de logo (opcional)
  if (req.file) {
    updateData.logo_url = `/uploads/publishers/${req.file.filename}`;
  }

  try {
    await apiClient.put(`/publishers/${publisherId}`, updateData);
    res.redirect(`/publisher/${publisherId}`); // o página de detalle
  } catch (error) {
    // Recarga formulario con error
    const response = await apiClient.get(`/publishers/${publisherId}`);
    const publisher = response.data;

    res.render("publishers/edit", {
      publisher,
      error: error.response?.data?.message || "Error al actualizar editorial",
      user: req.session.user || null,
    });
  }
}

async function deleteGenre(req, res) {
  try {
    const { genreName } = req.params;
    await apiClient.delete(`/genres/${genreName}`);
    res.redirect("/genres");
  } catch (error) {
    console.error("Error al eliminar el género:", error);
    res.status(500).send("Error al eliminar el género");
  }
}

export default {
  getGenres,
  getGenreBooksByGenreName,
  getCreateGenre,
  createGenre,
  getEditGenre,
  updateGenre,
  deleteGenre,
};
