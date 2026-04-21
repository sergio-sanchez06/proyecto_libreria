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

async function deleteOrder(req, res) {
  try {
    const order = await OrderRepository.deleteOrder(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el autor" });
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

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
};
