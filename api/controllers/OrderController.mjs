import OrderRepository from "../Repositories/OrderRepository.mjs";
import emailService from "../services/emailService.mjs";

async function createOrder(req, res) {
  const { items, shipping_address } = req.body;
  const { id: user_id, email, name, default_address } = req.user;

  const finalAddress = shipping_address || default_address;

  if (!finalAddress) {
    return res
      .status(400)
      .json({ error: "Se requiere una dirección de envío." });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "El carrito está vacío" });
  }

  try {
    const order = await OrderRepository.createOrder({
      items,
      user_id,
      shipping_address: finalAddress,
    });

    console.log("Items del pedido: ", order);

    emailService
      .sendOrderConfirmationEmail(
        email,
        name,
        finalAddress,
        order.items, // Detalles enriquecidos (con títulos)
        order.total,
      )
      .catch((err) => console.error("Error asíncrono enviando email:", err));

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el pedido" });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await OrderRepository.getOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el autor" });
  }
}

async function getOrdersByUser(req, res) {
  try {
    const orders = await OrderRepository.getOrdersByUser(req.params.id);
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el autor" });
  }
}

async function updateOrder(req, res) {
  try {
    const update_data = { id: req.params.id, ...req.body }; // Crea un objeto que añade el id al resto de parámetros del body
    const order = await OrderRepository.updateOrder(update_data);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el autor" });
  }
}

async function cancelOrder(req, res) {
  try {
    const order = await OrderRepository.cancelOrder(req.params.id);
    res
      .status(200)
      .json({ message: "Pedido cancelado correctamente", order: order });
  } catch (error) {
    console.error(error);
    const status = error.message.includes("no encontrado")
      ? 404
      : error.message.includes("ya fue cancelado")
        ? 409
        : 500;
    res.status(status).json({ error: error.message });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await OrderRepository.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los autores" });
  }
}

async function paymentAndEmail(req, res) {
  try {
    const email = await OrderRepository.payment(
      req.body.items,
      req.body.user,
      req.body.shipping_address,
    );
    res.status(200).json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los autores" });
  }
}

async function confirmStripeSession(req, res) {
  const { session_id } = req.query;

  if (!session_id)
    return res.status(400).json({ error: "Falta el ID de sesión" });

  try {
    const order = await OrderRepository.confirmStripeSession(session_id);

    console.log("Items para el email:", JSON.stringify(order.items[0], null, 2));

    if (order) {
      // Respondemos JSON de éxito para que la WEB borre la cookie

      emailService
        .sendOrderConfirmationEmail(
          order.user_email,
          order.user_name,
          order.shipping_address,
          order.items,
          order.total,
        )
        .catch((err) =>
          console.error("Error enviando email de pedido:", err.message),
        );

      return res.status(200).json({ status: "success", order });
    }
    res.status(400).json({ error: "El pago no ha sido verificado" });
  } catch (error) {
    // ESTO ES VITAL: Ver el error real en la terminal del backend
    console.error("ERROR CRÍTICO EN API:", error.message);
    res.status(500).json({ error: error.message });
  }
}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  cancelOrder,
  getAllOrders,
  paymentAndEmail,
  confirmStripeSession,
};
