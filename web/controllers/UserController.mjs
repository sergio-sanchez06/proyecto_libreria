import { getAuthenticatedClient } from "../utils/apiClient.mjs";

async function getProfile(req, res) {
  // 1. Verificación de seguridad en el controlador web
  if (!req.session.user || !req.session.idToken) {
    console.log("Sesión no encontrada o token ausente");
    return res.redirect("/login");
  }

  try {
    // 2. Limpieza preventiva: Si por error guardaste el token con "Bearer " en la sesión,
    // lo limpiamos para que getAuthenticatedClient no lo duplique.
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

    // 3. Creamos el cliente de Axios configurado con el Token
    const api = getAuthenticatedClient(cleanToken);

    // 4. Petición a la API (Consumo Indirecto)
    const response = await api.get("/users/me");

    // 5. Renderizamos con los datos frescos de la base de datos (profileData)
    // que vendrán de tus 3 tablas (usuario, direcciones, roles)
    res.render("perfil", {
      user: req.session.user, // Datos de sesión
      profile: response.data, // Datos reales de la DB local
      error: null,
    });
  } catch (error) {
    console.error(
      "Error en getProfile (Web):",
      error.response?.data || error.message
    );

    // Si la API dice que el token expiró (401/403), mandamos al login
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.redirect("/login");
    }

    res.render("perfil", {
      user: req.session.user,
      profile: null,
      error:
        "No se pudo conectar con el servidor para cargar tus datos detallados.",
    });
  }
}

async function getPurchaseHistory(req, res) {
  console.log("Hemos entrado al controlador de mis compras");

  if (!req.session.user || !req.session.idToken) {
    return res.redirect("/login");
  }

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const api = getAuthenticatedClient(cleanToken);

    // 1. Obtener los pedidos del usuario
    const response = await api.get("/orders/user/" + req.session.user.id);
    const orders = response.data;

    // 2. Obtener los ítems de cada pedido
    for (let order of orders) {
      const responseItems = await api.get("/orderItems/" + order.id);
      order.items = responseItems.data;
    }

    // 3. Recopilar todos los IDs de libros que necesitamos consultar
    const allBookIds = [
      ...new Set(orders.flatMap((o) => o.items.map((i) => i.book_id))),
    ];

    if (allBookIds.length > 0) {
      // 4. Consultar los libros a la API (o repositorio)
      // Usamos Promise.all para buscar todos los libros en paralelo de forma eficiente
      const bookPromises = allBookIds.map((id) =>
        api.get("/books/" + id).then((r) => r.data)
      );
      const booksData = await Promise.all(bookPromises);

      // 5. Crear un mapa para buscar el título rápidamente por ID
      const titlesMap = new Map(booksData.map((b) => [b.id, b.title]));

      // 6. Inyectar el título directamente en el objeto del ítem
      orders.forEach((order) => {
        order.items.forEach((item) => {
          // Creamos la propiedad 'book_title' sobre la marcha (en tiempo de ejecución)
          item.book_title =
            titlesMap.get(item.book_id) || "Título no disponible";
        });
      });
    }

    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: orders,
    });
  } catch (error) {
    console.error("Error en getPurchaseHistory:", error.message);
    res.render("partials/purchaseHistory", {
      title: "Mis compras",
      user: req.session.user,
      orders: [],
      error: "Error al cargar los nombres de los libros.",
    });
  }
}

export default {
  getProfile,
  getPurchaseHistory,
};
