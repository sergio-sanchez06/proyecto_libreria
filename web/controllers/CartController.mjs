// Añadir al carrito
async function addToCart(req, res) {
  const { book_id, quantity = 1 } = req.body;

  let cart = req.signedCookies.cart || [];

  const itemIndex = cart.findIndex((item) => item.book_id == book_id);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += parseInt(quantity);
    if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
  } else if (quantity > 0) {
    cart.push({ book_id: parseInt(book_id), quantity: parseInt(quantity) });
  }

  res.cookie("cart", cart, {
    signed: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana
    httpOnly: true,
    secure: false, // true en producción con HTTPS
  });

  res.redirect("back");
}

// Ver carrito
async function viewCart(req, res) {
  let cart = req.signedCookies.cart || [];

  // Opcional: carga datos de libros desde API para mostrar título/precio
  try {
    const bookIds = cart.map((item) => item.book_id);
    if (bookIds.length > 0) {
      const response = await apiClient.get("/books", {
        params: { ids: bookIds.join(",") },
      });
      const booksMap = response.data.reduce((map, book) => {
        map[book.id] = book;
        return map;
      }, {});

      cart = cart.map((item) => ({
        ...item,
        book: booksMap[item.book_id] || { title: "Libro no encontrado" },
      }));
    }
  } catch (error) {
    console.error("Error cargando datos de libros:", error);
  }

  const total = cart.reduce(
    (sum, item) => sum + (item.book?.price || 0) * item.quantity,
    0
  );

  res.render("cart/view", { cart, total, user: req.session.user || null });
}

// Checkout
async function checkout(req, res) {
  const cart = req.signedCookies.cart || [];

  if (cart.length === 0) {
    return res.render("cart/view", { error: "Carrito vacío" });
  }

  try {
    const orderData = { items: cart };
    await apiClient.post("/orders", orderData);

    res.clearCookie("cart");
    res.render("cart/success", { user: req.session.user || null });
  } catch (error) {
    res.render("cart/view", {
      cart,
      error: error.response?.data?.message || "Error en checkout",
    });
  }
}

export default {
  addToCart,
  viewCart,
  checkout,
};
