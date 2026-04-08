import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// --- AÑADIR AL CARRITO --- (Sin cambios, es correcto)
async function addToCart(req, res) {
  const { book_id, quantity = 1 } = req.body;
  let cart = req.signedCookies.cart || [];
  const parsedBookId = parseInt(book_id);
  const parsedQuantity = parseInt(quantity);

  if (isNaN(parsedBookId) || isNaN(parsedQuantity)) return res.redirect("/");

  const itemIndex = cart.findIndex((item) => item.book_id === parsedBookId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += parsedQuantity;
    if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
  } else if (parsedQuantity > 0) {
    cart.push({ book_id: parsedBookId, quantity: parsedQuantity });
  }

  res.cookie("cart", cart, {
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
  });

  // CAMBIO AQUÍ: Redirige explícitamente a la ruta del carrito
  // Si tu ruta es /cart/view, pon esa. Si es /cart, pon esta:
  res.redirect("/cart/view");
}

// --- VER CARRITO (ADAPTADO) ---
// --- ESTE ES EL CONTROLADOR DE LA WEB (Donde está viewCart) ---

async function viewCart(req, res) {
  let cart = req.signedCookies.cart || [];
  let total = 0;

  if (cart.length > 0) {
    try {
      // 1. Obtenemos solo los IDs únicos del carrito
      const bookIds = cart.map((item) => item.book_id);

      // 2. Pedimos a la API SOLO esos libros (Optimizado)
      const response = await apiClient.get("/books/carrusel", {
        params: { ids: bookIds.join(",") },
      });

      // 3. Creamos un mapa indexado por ID para acceso rápido
      const booksMap = {};
      response.data.forEach((book) => {
        booksMap[Number(book.id)] = book;
      });

      // 4. Enriquecemos el carrito con los datos de los libros
      cart = cart.map((item) => {
        // Buscamos el libro en el mapa. Si no existe (ej: borrado de la DB),
        // usamos un objeto por defecto para que EJS no de error.
        const bookData = booksMap[Number(item.book_id)] || {
          title: "Libro no encontrado",
          price: 0,
          cover_url: "/images/default-cover.jpg",
          stock: 0,
        };

        // Sumamos al total solo si el libro existe y tiene precio
        total += Number(bookData.price) * item.quantity;

        return {
          ...item,
          book: bookData, // Garantizamos que 'book' siempre existe para la vista
        };
      });
    } catch (error) {
      console.error("Error cargando libros del carrito:", error.message);

      // Fallback: Si la API falla, rellenamos con datos de error para no romper la vista
      cart = cart.map((item) => ({
        ...item,
        book: {
          title: "Error al cargar datos",
          price: 0,
          cover_url: "/images/default-cover.jpg",
          stock: 0,
        },
      }));
    }
  }

  // 5. Renderizamos la vista con los datos procesados
  res.render("partials/cartView", {
    cart,
    user: req.session.user,
    total: total.toFixed(2),
    error:
      cart.length > 0 && total === 0
        ? "Algunos productos no están disponibles"
        : null,
  });
}

// --- CHECKOUT (ADAPTADO) ---
async function checkout(req, res) {
  const firebaseToken = req.body.firebase_token;
  const cart = req.signedCookies.cart || [];

  if (!firebaseToken) return res.redirect("/login");
  if (cart.length === 0)
    return res.render("partials/cartView", {
      cart: [],
      total: 0,
      error: "Vacío",
    });

  try {
    const bookIds = cart.map((item) => item.book_id);

    // LLAMADA OPTIMIZADA
    const booksResponse = await apiClient.get("/books/carrusel", {
      params: { ids: bookIds.join(",") },
    });

    const booksMap = new Map(booksResponse.data.map((b) => [Number(b.id), b]));
    let total = 0;
    const enrichedCart = cart.map((item) => {
      const book = booksMap.get(Number(item.book_id));
      total += (book ? Number(book.price) : 0) * item.quantity;
      return { ...item, book: book || { title: "No disponible", price: 0 } };
    });

    // Petición de creación de pedido
    await apiClient.post(
      "/orders",
      { items: cart },
      {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      },
    );

    var asd = await apiClient.post("/orders/payment",{items: cart, user: req.session.user})
    res.clearCookie("cart");
    return res.redirect(asd.data.url)

  } catch (error) {
    // Manejo de errores (el que ya tenías es correcto)
    res.status(500).send("Error en el proceso de compra");
  }
}

export default { addToCart, viewCart, checkout };
