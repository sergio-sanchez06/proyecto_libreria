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
    return res.redirect("back");
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
  res.redirect("back");
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

  res.render("cartView", {
    cart,
    total: total.toFixed(2),
    error: null,
  });
}

// Checkout
async function checkout(req, res) {
  console.log("Entrando al Checkout:", req.body);

  const firebaseToken = req.body.firebase_token;

  if (!firebaseToken) {
    // Si no hay token, redirigir a login
    return res.redirect("/login");
  }

  const cart = req.signedCookies.cart || [];

  if (cart.length === 0) {
    return res.render("cartView", {
      cart: [],
      total: 0,
      error: "Carrito vacío",
    });
  }

  // Calcular total (opcional, para mostrar en error)
  let total = 0;
  let enrichedCart = cart;

  try {
    const bookIds = cart.map((item) => item.book_id);
    const response = await apiClient.get("/books", {
      params: { ids: bookIds.join(",") },
    });
    const booksMap = {};
    response.data.forEach((book) => (booksMap[book.id] = book));

    enrichedCart = cart.map((item) => {
      const book = booksMap[item.book_id] || {
        title: "No encontrado",
        price: 0,
      };
      total += book.price * item.quantity;
      return { ...item, book };
    });
  } catch (error) {
    console.error("Error cargando libros:", error);
  }

  console.log("Cart:", cart);
  console.log("Enriched cart:", enrichedCart);
  console.log("Total:", total);
  console.log("Firebase token:", firebaseToken);

  try {
    console.log("Enriched cart:", enrichedCart);
    console.log("Total:", total);
    console.log("Firebase token:", firebaseToken);
    // Llamada a API con token de Firebase
    await apiClient.post(
      "/orders",
      { items: cart },
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }
    );

    res.clearCookie("cart");
    res.render("cartSuccess");
  } catch (error) {
    console.error("Error en checkout:", error.response?.data);
    res.render("cartView", {
      cart: enrichedCart,
      total: total.toFixed(2),
      error: error.response?.data?.error || "Error al procesar el pedido",
    });
  }
}

export default {
  addToCart,
  viewCart,
  checkout,
};
