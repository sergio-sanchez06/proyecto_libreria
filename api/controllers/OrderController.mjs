import OrderRepository from "../Repositories/OrderRepository.mjs";

async function createOrder(req, res) {
  try {
    const order = await OrderRepository.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el autor" });
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
