import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Añadir al carrito - SOLO añade y redirige
async function addToCart(req, res) {
  const { book_id, quantity = 1 } = req.body;

  let cart = req.signedCookies.cart || [];

  const parsedBookId = parseInt(book_id);
  const parsedQuantity = parseInt(quantity);

  if (isNaN(parsedBookId) || isNaN(parsedQuantity)) {
    return res.redirect("/");
  }

  const itemIndex = cart.findIndex((item) => item.book_id === parsedBookId);

  if (itemIndex > -1) {
    cart[itemIndex].quantity += parsedQuantity;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  } else if (parsedQuantity > 0) {
    cart.push({ book_id: parsedBookId, quantity: parsedQuantity });
  }

  // Guardar en cookie
  res.cookie("cart", cart, {
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
  });

  // ¡Redirige, no renderices aquí!
  res.redirect("/cart/view");
}

// Ver carrito - aquí sí renderizas
async function viewCart(req, res) {
  let cart = req.signedCookies.cart || [];
  let total = 0;

  if (cart.length > 0) {
    try {
      const bookIds = cart.map((item) => item.book_id);

      const response = await apiClient.get("/books", {
        params: { ids: bookIds.join(",") },
      });

      const booksMap = {};
      response.data.forEach((book) => {
        booksMap[book.id] = book;
      });

      cart = cart.map((item) => {
        const book = booksMap[item.book_id] || {
          title: "Libro no encontrado",
          price: 0,
          cover_url: "/images/default-cover.jpg",
        };
        total += book.price * item.quantity;
        return { ...item, book };
      });
    } catch (error) {
      console.error("Error cargando libros:", error);
      cart = cart.map((item) => ({
        ...item,
        book: {
          title: "Error al cargar",
          price: 0,
          cover_url: "/images/default-cover.jpg",
        },
      }));
    }
  }

  res.render("partials/cartView", {
    cart,
    user: req.session.user,
    total: total.toFixed(2),
    error: null,
  });
}

// Checkout
async function checkout(req, res) {
  const firebaseToken = req.body.firebase_token;
  const cart = req.signedCookies.cart || [];

  // 1. Validaciones previas básicas
  if (!firebaseToken) return res.redirect("/login");
  if (cart.length === 0) {
    return res.render("cartView", {
      cart: [],
      total: 0,
      error: "Tu carrito está vacío",
    });
  }

  let enrichedCart = [];
  let total = 0;

  try {
    // 2. Obtener datos actualizados de los libros para el total y la vista
    const bookIds = cart.map((item) => item.book_id);
    const booksResponse = await apiClient.get("/books", {
      params: { ids: bookIds.join(",") },
    });

    // Usamos un Map para buscar libros por ID de forma óptima
    const booksMap = new Map(booksResponse.data.map((b) => [Number(b.id), b]));

    enrichedCart = cart.map((item) => {
      const book = booksMap.get(Number(item.book_id));
      const price = book ? Number(book.price) : 0;
      total += price * item.quantity;
      return {
        ...item,
        book: book || { title: "Libro no disponible", price: 0 },
      };
    });

    // 3. Petición de creación de pedido a la API
    // Enviamos solo los datos mínimos, la API hará su propia validación
    await apiClient.post(
      "/orders",
      { items: cart },
      {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      }
    );

    // 4. Éxito: Limpiar carrito y mostrar confirmación
    res.clearCookie("cart");
    return res.redirect("/user/myOrders");
  } catch (error) {
    console.error("Error en Checkout:", error.response?.data || error.message);

    // 5. Gestión inteligente de errores para el usuario
    let errorMessage = "Ocurrió un error inesperado al procesar tu pedido.";

    if (error.response) {
      // Errores que vienen de tu API (ej: stock, autenticación)
      errorMessage = error.response.data?.error || errorMessage;

      // Si el token falló (401), quizá expiró la sesión
      if (error.response.status === 401) {
        return res.render("login", {
          error: "Tu sesión ha expirado, por favor inicia sesión de nuevo.",
        });
      }
    }

    // Volvemos a mostrar el carrito con el mensaje de error de la API
    return res.render("partials/cartView", {
      cart: enrichedCart,
      user: req.session.user,
      total: total.toFixed(2),
      error: errorMessage,
    });
  }
}

export default {
  addToCart,
  viewCart,
  checkout,
};
