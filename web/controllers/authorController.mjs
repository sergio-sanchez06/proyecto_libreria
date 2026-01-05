// import axios from "axios";
// import FormData from "form-data";
// import fs from "fs";

// const apiClient = axios.create({
//   baseURL: "http://localhost:3000",
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
// });

// async function getAuthorById(req, res) {
//   try {
//     const { id } = req.params;
//     const response = await apiClient.get(`/authors/${id}`);
//     const author = response.data;
//     const booksResponse = await apiClient.get(
//       `/bookAuthor/author/${author.name}`
//     );
//     const books = booksResponse.data;
//     console.log(books);
//     // console.log(books);
//     res.render("autor_detalle", { author, books, user: req.session.user });
//   } catch (error) {
//     console.error("Error al obtener el autor:", error);
//     res.status(500).send("Error al obtener el autor");
//   }
// }

// async function getEditAuthor(req, res) {
//   try {
//     const { id } = req.params;
//     const response = await apiClient.get(`/authors/${id}`);
//     const author = response.data;
//     res.render("editAuthor", { author });
//   } catch (error) {
//     console.error("Error al obtener el autor:", error);
//     res.status(500).send("Error al obtener el autor");
//   }
// }

// async function updateAuthor(req, res) {
//   try {
//     const { id } = req.params;
//     const formData = new FormData();

//     // Campos normales
//     for (const key in req.body) {
//       formData.append(key, req.body[key]);
//     }

//     // Archivo
//     if (req.file) {
//       formData.append(
//         "author_photo",
//         fs.createReadStream(req.file.path),
//         req.file.originalname
//       );
//     }
//     const response = await apiClient.put(`/authors/${id}`, formData, {
//       headers: formData.getHeaders(),
//     });

//     // Borrar archivo temporal
//     if (req.file) fs.unlinkSync(req.file.path);

//     const author = response.data;

//     res.redirect(`/author/${author.id}`);
//   } catch (error) {
//     console.error("Error al actualizar el autor:", error);
//     res.status(500).send("Error al actualizar el autor");
//   }
// }

// async function deleteAuthor(req, res) {
//   try {
//     const { id } = req.params;
//     await apiClient.delete(`/authors/${id}`);
//     res.redirect("/authors");
//   } catch (error) {
//     console.error("Error al eliminar el autor:", error);
//     res.status(500).send("Error al eliminar el autor");
//   }
// }

// async function getCreateAuthor(req, res) {
//   try {
//     res.render("admin/add_author", {
//       user: req.session.user,
//       error: null,
//     });
//   } catch (error) {
//     console.error("Error al obtener el autor:", error);
//     res.status(500).send("Error al obtener el autor");
//   }
// }

// async function createAuthor(req, res) {
//   console.log(req.body);

//   const authorData = req.body;

//   // Subida de foto (opcional)
//   if (req.file) {
//     authorData.photo_url = `/uploads/authors/${req.file.filename}`;
//   }

//   console.log(authorData);

//   try {
//     await apiClient.post("/authors", authorData);
//     res.redirect("/"); // o página de listado
//   } catch (error) {
//     console.error("Error al crear el autor:", error);
//     res.render("admin/add_author", {
//       error: error.response?.data?.message || "Error al crear autor",
//       user: req.session.user || null,
//     });
//   }
// }

// async function getAuthors(req, res) {
//   try {
//     const response = await apiClient.get("/authors");
//     const authors = response.data;
//     res.render("authors", { authors });
//   } catch (error) {
//     console.error("Error al obtener los autores:", error);
//     res.status(500).send("Error al obtener los autores");
//   }
// }

// async function editFormAuthor(req, res) {
//   try {
//     const { id } = req.params;
//     const response = await apiClient.get(`/authors/${id}`);
//     const author = response.data;
//     res.render("editAuthor", { author });
//   } catch (error) {
//     console.error("Error al obtener el autor:", error);
//     res.status(500).send("Error al obtener el autor");
//   }
// }

// export default {
//   getAuthorById,
//   getEditAuthor,
//   updateAuthor,
//   deleteAuthor,
//   createAuthor,
//   editFormAuthor,
//   getAuthors,
//   getCreateAuthor,
// };

// web/controllers/authorController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getAuthors(req, res) {
  try {
    const response = await apiClient.get("/authors");
    res.render("partials/authorsTable", {
      authors: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener los autores:", error);
    res.status(500).send("Error al obtener los autores");
  }
}

async function getAuthorById(req, res) {
  try {
    const { id } = req.params;
    // Peticiones paralelas para optimizar carga
    const authorResponse = await apiClient.get(`/authors/${id}`);
    const booksResponse = await apiClient.get(
      `/bookAuthor/author/${authorResponse.data.name}`
    );

    const author = authorResponse.data;
    const books = booksResponse.data;

    res.render("autor_detalle", {
      author,
      books,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(404).render("error", { message: "Autor no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/authors");
  res.render("admin/add_author", {
    user: req.session.user,
    error: null,
  });
}

async function createAuthor(req, res) {
  const authorData = req.body;

  if (req.file) {
    authorData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/authors", authorData);
    res.redirect("/authors");
  } catch (error) {
    res.render("admin/add_author", {
      error: error.response?.data?.message || "Error al crear autor",
      user: req.session.user,
    });
  }
}

async function getEditAuthor(req, res) {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/authors");
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    res.render("admin/edit_author", {
      author: response.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Autor no encontrado" });
  }
}

async function updateAuthor(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  if (req.file) {
    updateData.photo_url = `/uploads/authors/${req.file.filename}`;
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/authors/${id}`, updateData);
    res.redirect(`/author/${id}`);
  } catch (error) {
    res.render("admin/edit_author", {
      author: { ...req.body, id },
      error: error.response?.data?.message || "Error al actualizar autor",
      user: req.session.user,
    });
  }
}

async function deleteAuthor(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/authors/${req.params.id}`);
    res.redirect("/authors");
  } catch (error) {
    console.error("Error al eliminar autor:", error.response?.data);
    res
      .status(500)
      .send(
        "No se pudo eliminar el autor. Verifique si tiene libros vinculados."
      );
  }
}

export default {
  getAuthorById,
  getEditAuthor,
  updateAuthor,
  deleteAuthor,
  createAuthor,
  getAuthors,
  getCreateAuthor,
};
