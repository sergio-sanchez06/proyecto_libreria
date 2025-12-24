import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    const publisher = response.data;
    res.locals.publisher = publisher;
    next();
  } catch (error) {
    console.error("Error cargando editorial:", error);
    res.status(404).render("error", { message: "Editorial no encontrada" });
  }
}

export default {
  getPublishers,
  getPublisherById,
};
