// web/controllers/PublisherController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- MIDDLEWARES / HELPERS INTERNOS ---

async function publisher(req, res, next) {
  try {
    const response = await apiClient.get(`/publishers/${req.params.id}`);
    res.locals.publisher = response.data;
    res.locals.user = req.session.user || null;
    next();
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getPublishers(req, res, next) {
  try {
    const response = await apiClient.get("/publishers");
    res.locals.publishers = response.data;
    next();
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.locals.publishers = [];
    next();
  }
}

async function showAllPublishers(req, res, next) {
  try {
    const response = await apiClient.get("/publishers");
    res.locals.publishers = response.data;
    res.locals.user = req.session.user || null;
    res.render("partials/publishersTable", {
      publishers: response.data,
      user: res.locals.user,
    });
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.locals.publishers = [];
    res.render("partials/publishersTable", {
      publishers: [],
      user: res.locals.user,
    });
  }
}

async function getPublisherById(req, res, next) {
  try {
    const { id } = req.params;
    const [pubRes, booksRes] = await Promise.all([
      apiClient.get(`/publishers/${id}`),
      apiClient.get(`/books/publisher/${id}`),
    ]);

    res.render("partials/publisher_detalle", {
      publisher: pubRes.data,
      books: booksRes.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error cargando detalle editorial:", error);
    res
      .status(404)
      .render("error", { message: "Editorial o libros no encontrados" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getPublisherCreateForm(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");
  res.render("admin/add_publisher", { user: req.session.user, error: null });
}

async function createPublisher(req, res) {
  const publisherData = req.body;
  if (req.file) {
    publisherData.image_url = `/uploads/publishers/${req.file.filename}`;
  }

  try {
    // Limpieza de Token para evitar 401
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/publishers", publisherData);
    res.redirect("/publisher/showAllPublishers");
  } catch (error) {
    res.render("admin/add_publisher", {
      publisherData,
      error: error.response?.data?.message || "Error al crear editorial",
      user: req.session.user,
    });
  }
}

async function getPublisherEdit(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");
  try {
    const response = await apiClient.get(`/publishers/${req.params.id}`);
    res.render("admin/edit_publisher", {
      publisher: response.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

async function updatePublisher(req, res) {
  const publisherId = req.params.id;
  const updateData = req.body;

  if (req.file) {
    updateData.logo_url = `/uploads/publishers/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/publishers/${publisherId}`, updateData);
    res.redirect(`/publisher/${publisherId}`);
  } catch (error) {
    res.render("admin/edit_publisher", {
      publisher: { ...req.body, id: publisherId },
      error: error.response?.data?.message || "Error al actualizar editorial",
      user: req.session.user,
    });
  }
}

async function deletePublisher(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/publishers/${req.body.id}`);
    res.redirect("/publishers/showAllPublishers");
  } catch (error) {
    console.error("Error eliminando editorial:", error.response?.data);
    res
      .status(500)
      .send(
        "No se pudo eliminar la editorial. Verifique si tiene libros asociados."
      );
  }
}

export default {
  getPublishers,
  showAllPublishers,
  getPublisherById,
  getPublisherEdit,
  updatePublisher,
  deletePublisher,
  createPublisher,
  publisher,
  getPublisherCreateForm,
};
