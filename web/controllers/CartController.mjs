import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

// --- AÑADIR AL CARRITO --- (Sin cambios, es correcto)
async function addToCart(req, res) {
  const { book_id, quantity = 1, title, cover_url } = req.body;
  let cart = req.signedCookies.cart || [];
  const parsedBookId = parseInt(book_id);
  const parsedQuantity = parseInt(quantity);

  if (isNaN(parsedBookId) || isNaN(parsedQuantity)) return res.redirect("/");

  const itemIndex = cart.findIndex((item) => item.book_id === parsedBookId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += parsedQuantity;
    if (title) cart[itemIndex].title = title;
    if (cover_url) cart[itemIndex].cover_url = cover_url;
    if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
  } else if (parsedQuantity > 0) {
    cart.push({
      book_id: parsedBookId,
      quantity: parsedQuantity,
      title,
      cover_url,
    });
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
  console.log("Se ha entrado en el carrito");

  const user = req.session.user;

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
          title: item.title || "Libro no disponible",
          cover_url: item.cover_url || null,
          price: 0,
          stock: 0,
          unavailable: true,
        };

        if (bookData.stock === 0) bookData.unavailable = true;

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

  let availableAddresses = [];
  if (user) {
    if (
      user.default_address &&
      user.default_address !== "Pendiente de completar"
    ) {
      availableAddresses.push({
        id: "default",
        text: user.default_address,
        label: "Principal",
      });
    }
    if (user.optional_address?.trim()) {
      availableAddresses.push({
        id: "optional",
        text: user.optional_address,
        label: "Secundaria",
      });
    }
  }

  const hasUnavailable = cart.some((item) => item.book?.unavailable);

  // 5. Renderizamos la vista con los datos procesados
  res.render("partials/cartView", {
    cart,
    user: req.session.user || null,
    addresses: availableAddresses, // <--- Nueva variable para el EJS
    total: total.toFixed(2),
    error:
      cart.length > 0 && total === 0
        ? "Algunos productos no están disponibles"
        : null,
    hasUnavailable,
  });
}

// --- CHECKOUT (ADAPTADO) ---

async function checkout(req, res) {
  const firebaseToken = req.session.idToken;
  const { shipping_address } = req.body;
  const cart = req.signedCookies.cart || [];

  // 1. Validaciones de seguridad básicas
  if (!firebaseToken) return res.redirect("/login");

  if (!shipping_address) {
    // Devolver al usuario al carrito con un mensaje

    req.session.flash = {
      type: "error",
      message: "Por favor, selecciona una dirección de envío.",
    };

    return res.redirect("/cart/view");
  }

  if (cart.length === 0) return res.redirect("/cart/view");

  try {
    // 2. Obtener datos actualizados de los libros (para validación de precio/existencia)
    const bookIds = cart.map((item) => item.book_id);
    const booksResponse = await apiClient.get("/books/carrusel", {
      params: { ids: bookIds.join(",") },
    });

    const booksMap = new Map(booksResponse.data.map((b) => [Number(b.id), b]));
    let totalCalculado = 0;

    // Enriquecemos para calcular el total exacto antes de enviar a la API de órdenes
    cart.forEach((item) => {
      const book = booksMap.get(Number(item.book_id));
      if (book) {
        totalCalculado += Number(book.price) * item.quantity;
      }
    });

    // 3. Petición de creación de pedido
    // IMPORTANTE: Enviamos la shipping_address y el total calculado

    const cleanToken = firebaseToken.replace("Bearer ", "").trim(); // Limpiamos el token por si acaso
    const api = getAuthenticatedClient(cleanToken);

    // const response = await api.post("/orders", {
    //   items: cart,
    //   shipping_address: shipping_address, // <-- Enviamos la dirección seleccionada
    //   total: totalCalculado.toFixed(2), // <-- Enviamos el total para validación en el servidor
    // });

    var payment = await api.post("/orders/payment", {
      items: cart,
      user: req.session.user,
      shipping_address: shipping_address,
    });

    if (payment.data && payment.data.url) {
      return res.redirect(payment.data.url);
    }

    // // 4. Éxito: Solo limpiamos el carrito si la orden se creó correctamente en la DB
    // if (response.status === 201 || response.status === 200) {
    //   // Opcional: pasar un flag de éxito para mostrar un Toast en la siguiente vista

    //   req.session.flash = {
    //     type: "success",
    //     message: "Pedido creado con éxito.",
    //   };

    //   var payment = await api.post("/orders/payment", {
    //     items: cart,
    //     user: req.session.user,
    //     shipping_address: shipping_address,
    //   });

    //   if (payment.data && payment.data.url) {
    //     return res.redirect(payment.data.url);
    //   }

    //   // res.clearCookie("cart", { signed: true, path: "/" });
    //   //   return res.redirect("/users/myOrders")
    // }

    // Redirigimos al usuario al checkout de Stripe
    // res.redirect(response.data.url);
  } catch (error) {
    console.error(
      "Error detallado en Checkout:",
      error.response?.data?.message || error.message,
    );

    // Si el error es falta de stock (asumiendo que tu API devuelve 409 o similar)
    if (error.response?.status === 409) {
      req.session.flash = {
        type: "error",
        message:
          "Lo sentimos, uno de los productos en tu carrito ya no tiene stock o se ha modificado.",
      };
    } else {
      req.session.flash = {
        type: "error",
        message: "Error procesando la compra. Por favor, inténtalo de nuevo.",
      };
    }

    res.redirect("/cart/view");
  }
}

// async function checkout(req, res) {
//   const firebaseToken = req.body.firebase_token;
//   const { shipping_address } = req.body; // Viene del radio button del EJS
//   const cart = req.signedCookies.cart || [];

//   if (!firebaseToken) return res.redirect("/login");
//   if (!shipping_address) {
//     // Si el usuario no eligió dirección, podrías devolverlo con error
//     return res.status(400).send("Debes seleccionar una dirección de envío");
//   }
//   if (cart.length === 0)
//     return res.render("partials/cartView", {
//       cart: [],
//       total: 0,
//       error: "Vacío",
//     });

//   try {
//     const bookIds = cart.map((item) => item.book_id);

//     // LLAMADA OPTIMIZADA
//     const booksResponse = await apiClient.get("/books/carrusel", {
//       params: { ids: bookIds.join(",") },
//     });

//     const booksMap = new Map(booksResponse.data.map((b) => [Number(b.id), b]));
//     let total = 0;
//     const enrichedCart = cart.map((item) => {
//       const book = booksMap.get(Number(item.book_id));
//       total += (book ? Number(book.price) : 0) * item.quantity;
//       return { ...item, book: book || { title: "No disponible", price: 0 } };
//     });

//     // Petición de creación de pedido
//     await apiClient.post(
//       "/orders",
//       { items: cart },
//       {
//         headers: { Authorization: `Bearer ${firebaseToken}` },
//       },
//     );

//     res.clearCookie("cart");
//     return res.redirect("/user/myOrders");
//   } catch (error) {
//     // Manejo de errores (el que ya tenías es correcto)
//     res.status(500).send("Error en el proceso de compra");
//   }
// }

export default { addToCart, viewCart, checkout };
