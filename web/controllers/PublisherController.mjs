// web/controllers/PublisherController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redisController from "../controllers/RedisController.mjs";

let redisClient = null;

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
    // Definimos el cliente de redis

    redisClient = await redisController.returnRedisClient();

    // Verificamos si ya hay datos en la cache de redis

    const redisData = await redisClient.get("AllPublishers");

    if (redisData) {
      res.locals.publishers = JSON.parse(redisData);
    } else {
      // Si no hay cache se recogen todas las editoriales y se almacenan en redis, con un TTL de 1 hora.

      const response = await apiClient.get("/publishers");
      const publishers = response.data;
      await redisClient.set("AllPublishers", JSON.stringify(publishers), {
        EX: 3600,
      });
    }

    next();
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.locals.publishers = [];
    next();
  }
}

/*async function showAllPublishers(req, res, next) {
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
}*/

async function showAllPublishers(req, res, next) {
  try {
    const page = req.query.page || 1;
    const limit = 4;

    const response = await apiClient.get(
      `/publishers?page=${page}&limit=${limit}`,
    );

    res.locals.user = req.session.user || null;

    res.render("partials/publishersTable", {
      publishers: response.data.data,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages,
      user: res.locals.user,
    });
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.render("partials/publishersTable", {
      publishers: [],
      currentPage: 1,
      totalPages: 1,
      user: req.session.user || null,
    });
  }
}

async function getPublisherById(req, res, next) {
  try {
    const { id } = req.params;

    const pubRes = await apiClient.get(`/publishers/${id}`);
    console.log(pubRes.data);

    if (!pubRes.data || !pubRes.data.id) {
      return res.status(404).render("errors/404", {
        message: "Editorial no encontrada",
      });
    }

    const booksRes = await apiClient.get(`/books/publisher/${id}`);

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

    // Borramos la cache de redis para forzar la actualización de los datos.
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllPublishers");

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

    // Borramos la cache de redis para forzar la actualización de los datos.
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllPublishers");

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

    console.log(req.params.id);

    await api.delete(`/publishers/${req.params.id}`);

    // Borramos la cache de redis para forzar la actualización de los datos.
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllPublishers");

    res.redirect("/publisher/manage/list?success=true");
  } catch (error) {
    console.error("Error eliminando editorial:", error.response?.data);
    res
      .status(500)
      .send(
        "No se pudo eliminar la editorial. Verifique si tiene libros asociados.",
      );
  }
}

async function getManagePublishers(req, res) {
  try {
    const page = req.query.page || 1;
    const limit = 4;
    const deleted = req.query.deleted || false;

    const response = await apiClient.get(
      `/publishers?page=${page}&limit=${limit}&deleted=${deleted}`,
    );

    res.locals.user = req.session.user || null;

    res.render("admin/publishers_list", {
      publishers: response.data.data,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages,
      user: res.locals.user,
    });
  } catch (error) {
    console.error("Error cargando editoriales:", error);
    res.render("admin/publishers_list", {
      publishers: [],
      currentPage: 1,
      totalPages: 1,
      user: req.session.user || null,
    });
  }
}

async function restorePublisher(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    console.log(req.params.id);

    await api.put(`/publishers/restore/${req.params.id}`);

    // Borramos la cache de redis para forzar la actualización de los datos.
    redisClient = await redisController.returnRedisClient();
    await redisClient.del("AllPublishers");

    res.redirect("/publisher/manage/list?success=true");
  } catch (error) {
    console.error("Error restaurando editorial:", error.response?.data);
    res.status(500).send("No se pudo restaurar la editorial.");
  }
}
// async function restorePublisher(req, res) {
//   try {
//     const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
//     const api = getAuthenticatedClient(cleanToken);

//     console.log(req.params.id);

//     await api.put(`/publishers/restore/${req.params.id}`);
//     res.redirect("/publisher/manage/list?deleted=true");
//   } catch (error) {
//     console.error("Error restaurando editorial:", error.response?.data);
//     res.status(500).send("No se pudo restaurar la editorial.");
//   }
// }

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
  getManagePublishers,
  restorePublisher,
};
