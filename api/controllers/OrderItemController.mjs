import OrderItemRepository from "../Repositories/OrderItemRepository.mjs";

async function create(req, res) {
  try {
    const orderItem = await OrderItemRepository.create(req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    console.error("Error al crear order_item:", error);
    res
      .status(400)
      .json({ error: error.message || "Error al crear item del pedido" });
  }
}

async function getById(req, res) {
  try {
    const orderItem = await OrderItemRepository.getById(req.params.id);
    if (!orderItem) {
      return res.status(404).json({ error: "Item del pedido no encontrado" });
    }
    res.json(orderItem);
  } catch (error) {
    console.error("Error al obtener order_item:", error);
    res.status(500).json({ error: "Error interno" });
  }
}

async function getAll(req, res) {
  try {
    const orderItems = await OrderItemRepository.getAll();
    res.json(orderItems);
  } catch (error) {
    console.error("Error al obtener order_items:", error);
    res.status(500).json({ error: "Error interno" });
  }
}

async function update(req, res) {
  try {
    const updateData = { id: req.params.id, ...req.body };
    const orderItem = await OrderItemRepository.update(updateData);
    if (!orderItem) {
      return res.status(404).json({ error: "Item del pedido no encontrado" });
    }
    res.json(orderItem);
  } catch (error) {
    console.error("Error al actualizar order_item:", error);
    res
      .status(400)
      .json({ error: error.message || "Error al actualizar item" });
  }
}

async function deleteItem(req, res) {
  try {
    const deleted = await OrderItemRepository.deleteItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item del pedido no encontrado" });
    }
    res.json({ message: "Item eliminado" });
  } catch (error) {
    console.error("Error al eliminar order_item:", error);
    res.status(500).json({ error: "Error interno" });
  }
}

export default {
  create,
  getById,
  getAll,
  update,
  deleteItem,
};
