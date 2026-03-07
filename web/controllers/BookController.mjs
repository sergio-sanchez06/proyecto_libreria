<<<<<<< HEAD
// web/controllers/BookController.mjs

class BookController {
    constructor() {
        // La URL de tu API sin el prefijo /api, según tu configuración en app.mjs
        this.apiUrl = "http://localhost:3000/books"; 
    }

    async cargarLibrosEnPantalla() {
        const contenedor = document.getElementById("contenedor-libros");
        
        try {
            // 1. Llamamos a la API (usa el método getAllBooks que definimos)
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.status}`);
            }

            const libros = await response.json();

            // 2. Limpiamos el contenedor (quitamos el mensaje de "Conectando...")
            contenedor.innerHTML = "";

            if (libros.length === 0) {
                contenedor.innerHTML = "<p>No hay libros disponibles en el catálogo.</p>";
                return;
            }

            // 3. Generamos las tarjetas usando las clases del main.css
            libros.forEach(libro => {
                const div = document.createElement("div");
                div.className = "libro-card"; 
                
                // Estructura optimizada para el CSS de cuadrícula
                div.innerHTML = `
                    <img src="${libro.portada || 'https://via.placeholder.com/150'}" alt="${libro.titulo}">
                    <div class="libro-card-info">
                        <div>
                            <h3>${libro.titulo}</h3>
                            <p><strong>Autor:</strong> ${libro.autor}</p>
                        </div>
                        <div>
                            <p class="precio">${libro.precio} €</p>
                            <button class="btn-detalles" onclick="verDetalle(${libro.id})">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                `;
                contenedor.appendChild(div);
            });
        } catch (error) {
            console.error("Error al conectar con la API:", error);
            contenedor.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: red;">
                    <p>No se han podido cargar los libros.</p>
                    <small>Asegúrate de que la API esté corriendo en el puerto 3000 y Supabase esté conectado.</small>
                </div>`;
        }
    }
}

// Función global para manejar el clic en "Ver Detalles"
window.verDetalle = (id) => {
    // Redirige a la página de detalle pasando el ID por la URL
    window.location.href = `libro_detalle.html?id=${id}`;
};

// Inicializamos y ejecutamos
const bookCtrl = new BookController();
bookCtrl.cargarLibrosEnPantalla();

export default bookCtrl;
=======
// web/controllers/bookController.mjs
import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- FUNCIONES PÚBLICAS (Lectura) ---

async function getAllBooks(req, res) {
  try {
    const response = await apiClient.get("/books");
    res.render("index", {
      books: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

async function showAllBooks(req, res) {
  try {
    const response = await apiClient.get("/books");
    res.render("partials/booksTable", {
      books: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).render("error", { message: "Error al cargar el catálogo" });
  }
}

async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const bookResponse = await apiClient.get(`/books/${id}`);

    const authorsResponse = await apiClient.get(
      `/bookAuthor/book/id/${bookResponse.data.id}`
    );

    const genresResponse = await apiClient.get(
      `/bookGenre/book/${bookResponse.data.id}`
    );

    const publisherResponse = await apiClient.get(
      `/publishers/${bookResponse.data.publisher_id}`
    );

    const book = bookResponse.data;
    const authors = authorsResponse.data;
    const genres = genresResponse.data;
    const publisher = publisherResponse.data;
    res.render("partials/libro_detalle", {
      book,
      authors,
      genres,
      publisher,
      user: req.session.user || null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

// --- FUNCIONES DE ADMINISTRADOR (Escritura) ---

async function getCreateBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    // Cargamos autores, géneros y editoriales para los selects del formulario
    const [authors, genres, publishers] = await Promise.all([
      apiClient.get("/authors"),
      apiClient.get("/genres"),
      apiClient.get("/publishers"),
    ]);

    res.render("admin/add_book", {
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(500).send("Error al cargar datos para el formulario");
  }
}

async function createBook(req, res) {
  const bookData = req.body;

  if (req.file) {
    bookData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  console.log(bookData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.post("/books", bookData);
    res.redirect("/books/showAllBooks");
  } catch (error) {
    console.log("Error al crear libro:", error);
    console.log(error);

    // Si falla, volvemos a cargar el formulario con el error
    res.render("admin/add_book", {
      error: error.response?.data?.message || "Error al crear libro",
      user: req.session.user,
    });
  }
}

async function getEditBook(req, res) {
  if (!req.session.user || req.session.user.role !== "ADMIN")
    return res.redirect("/");

  try {
    const { id } = req.params;
    const [bookRes, authors, genres, publishers] = await Promise.all([
      apiClient.get(`/books/${id}`),
      apiClient.get("/authors"),
      apiClient.get("/genres"),
      apiClient.get("/publishers"),
    ]);

    res.render("admin/edit_book", {
      book: bookRes.data,
      authors: authors.data,
      genres: genres.data,
      publishers: publishers.data,
      user: req.session.user,
      error: null,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Libro no encontrado" });
  }
}

async function updateBook(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  if (req.file) {
    updateData.cover_url = `/uploads/covers/${req.file.filename}`;
  }

  console.log(updateData);

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.put(`/books/${id}`, updateData);
    res.redirect(`/books/book/${id}`);
  } catch (error) {
    res.status(500).send("Error al actualizar el libro");
  }
}

async function deleteBook(req, res) {
  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    await api.delete(`/books/${req.body.id}`);
    res.redirect("/books/showAllBooks");
  } catch (error) {
    console.error("Error al eliminar libro:", error.response?.data);
    res.status(500).send("No se pudo eliminar el libro.");
  }
}

export default {
  getAllBooks,
  showAllBooks,
  getBookById,
  getCreateBook,
  createBook,
  getEditBook,
  updateBook,
  deleteBook,
};
>>>>>>> api
