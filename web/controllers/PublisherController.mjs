import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

async function publisher(req, res, next) {
  try {
    const response = await apiClient.get(`/publishers/${req.params.id}`);
    const publisher = response.data;
    res.locals.publisher = publisher;
    next();
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

async function getPublishers(req, res, next) {
  try {
    const response = await apiClient.get("/publishers");
    const publishers = response.data;
    res.locals.publishers = publishers;
    next();
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.locals.publishers = [];
    next();
  }
}

async function getPublisherById(req, res, next) {
  try {
    const response = await apiClient.get(`/publishers/${req.params.id}`);
    const booksResponse = await apiClient.get(
      `/books/publisher/${req.params.id}`
    );
    const books = booksResponse.data;
    const publisher = response.data;
    res.locals.publisher = publisher;
    res.locals.books = books;
    res.locals.user = req.session.user || null;
    res.render("publisher_detalle", {
      publisher,
      books,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

async function getPublisherEdit(req, res, next) {
  try {
    const response = await apiClient.get(`/publishers/edit/${req.params.id}`);
    const publisher = response.data;
    res.locals.publisher = publisher;
    next();
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

async function updatePublisher(req, res, next) {
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

async function deletePublisher(req, res, next) {
  try {
    const response = await apiClient.delete(
      `/publishers/delete/${req.params.id}`
    );
    const publisher = response.data;
    res.locals.publisher = publisher;
    next();
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

async function createPublisher(req, res, next) {
  const publisherData = req.body;

  // Subida de logo (opcional)
  if (req.file) {
    publisherData.logo_url = `/uploads/publishers/${req.file.filename}`;
  } else {
    publisherData.logo_url = `/uploads/publishers/default.png`;
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

async function getPublisherCreateForm(req, res, next) {
  try {
    const response = await apiClient.get(`/publishers/create`);
    const publisher = response.data;
    res.locals.publisher = publisher;
    res.locals.user = req.session.user;
    res.render("admin/add_publisher", { publisher, user });
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

export default {
  getPublishers,
  getPublisherById,
  getPublisherEdit,
  updatePublisher,
  deletePublisher,
  createPublisher,
  publisher,
  getPublisherCreateForm,
};
