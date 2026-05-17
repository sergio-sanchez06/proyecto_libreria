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

    console.log("Datos de actualización: ", update_data);

    const order = await OrderRepository.updateOrder(update_data);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el estado del pedido" });
  }
}

async function cancelOrder(req, res) {
  try {
    const order = await OrderRepository.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    const { items, refunded, user_email, user_name } =
      await OrderRepository.cancelOrder(req.params.id, true);

    console.log(`Administrador cancelando pedido ${order.id}`, {
      user_email,
      user_name,
      order,
      items,
      refunded,
    });

    emailService
      .sendOrderCancellationEmail(
        user_email,
        user_name,
        order.id,
        items,
        refunded,
      )
      .catch((err) =>
        console.error("Error enviando email de cancelación:", err),
      );

    res.status(200).json({
      message: refunded
        ? "Pedido cancelado y reembolso procesado"
        : "Pedido cancelado correctamente",
    });
  } catch (error) {
    console.error(error);
    const msg = error.message;
    const status = msg.includes("no encontrado")
      ? 404
      : msg.includes("ya fue cancelado")
        ? 409
        : msg.includes("No se puede cancelar")
          ? 409
          : 500;
    res.status(status).json({ error: msg });
  }
}
async function userCancelOrder(req, res) {
  try {
    const order = await OrderRepository.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }
    if (String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: "No autorizado." });
    }
    if (!["PENDIENTE", "PAGADO"].includes(order.status.toUpperCase())) {
      return res.status(409).json({
        error: `No puedes cancelar un pedido en estado ${order.status}.`,
      });
    }

    const { items, refunded, user_email, user_name } =
      await OrderRepository.cancelOrder(req.params.id);

    emailService
      .sendOrderCancellationEmail(
        user_email,
        user_name,
        order.id,
        items,
        refunded,
      )
      .catch((err) =>
        console.error("Error enviando email de cancelación:", err),
      );

    res.status(200).json({
      message: refunded
        ? "Pedido cancelado y reembolso procesado"
        : "Pedido cancelado correctamente",
    });
  } catch (error) {
    console.error(error);
    const msg = error.message;
    const status = msg.includes("no encontrado")
      ? 404
      : msg.includes("ya fue cancelado")
        ? 409
        : msg.includes("No se puede cancelar")
          ? 409
          : 500;
    res.status(status).json({ error: msg });
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

    console.log(
      "Items para el email:",
      JSON.stringify(order.items[0], null, 2),
    );

    if (order) {
      // Respondemos JSON de éxito para que la WEB borre la cookie

      emailService
        .sendOrderConfirmationEmail(
          order.user_email,
          order.user_name,
          order.shipping_address,
          order.items,
          order.total,
          order.id
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

async function adminConfirmReturn(req, res) {
  try {
    const { id } = req.params;
    const order = await OrderRepository.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    // VALIDACIÓN CLAVE: Solo si el usuario pasó por el estado 'DEVOLUCION_PENDIENTE'
    if (order.status !== "DEVOLUCION_PENDIENTE") {
      return res.status(400).json({
        error:
          "No se puede confirmar. El usuario no ha solicitado la devolución formalmente.",
      });
    }

    // Ejecutamos la lógica común del repositorio
    const { items, user_email, user_name } =
      await OrderRepository.confirmReturn(id);

    emailService
      .sendReturnCompletedEmail(user_email, user_name, order.id, items)
      .catch((err) =>
        console.error("Error enviando email de devolución:", err.message),
      );

    return res.status(200).json({
      message: "Devolución procesada: stock actualizado y reembolso emitido.",
    });
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 400).json({
      error: error.message,
    });
  }
}

async function userRequestReturn(req, res) {
  try {
    const { id } = req.params;
    const order = await OrderRepository.getOrderById(id);

    // 1. Validaciones de seguridad
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    // 2. Verificar que el pedido le pertenece
    if (String(order.user_id) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para gestionar este pedido." });
    }

    // 3. Validar el estado: Solo se puede devolver si ya ha sido ENTREGADO
    if (order.status !== "ENTREGADO") {
      return res.status(400).json({
        error: `No puedes solicitar la devolución de un pedido en estado ${order.status}.`,
      });
    }

    // 4. Actualizar el estado a 'DEVOLUCION_PENDIENTE'
    const { user_email, user_name, items } = await OrderRepository.updateOrder({
      id: id,
      status: "DEVOLUCION_PENDIENTE",
    });

    // 5. Enviar email informativo al usuario
    // Creamos este método en el emailService para dar instrucciones de envío
    emailService
      .sendRequestReturnEmail(user_email, user_name, order.id, items)
      .catch((err) => console.error("Error enviando email de solicitud:", err));

    res.status(200).json({
      message:
        "Solicitud de devolución registrada. Pendiente de recepción de los artículos.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al procesar la solicitud de devolución." });
  }
}

async function adminForceReturn(req, res) {
  try {
    const { id } = req.params;
    const order = await OrderRepository.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    // VALIDACIÓN FLEXIBLE: El admin puede forzar desde cualquier estado que implique pago
    const allowedStatuses = [
      "PAGADO",
      "PROCESANDO",
      "ENVIADO",
      "ENTREGADO",
      "DEVOLUCION_PENDIENTE",
    ];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        error: `No se puede forzar la devolución en un pedido con estado ${order.status}.`,
      });
    }

    // Llamamos al MISMO método del repositorio
    const { items, user_email, user_name } =
      await OrderRepository.confirmReturn(id, true);

    // Enviamos email al usuario indicando que la devolución ha sido forzada
    emailService
      .sendReturnCompletedEmail(user_email, user_name, items)
      .catch((err) =>
        console.error(
          "Error enviando email de confirmación de devolución:",
          err,
        ),
      );

    return res.status(200).json({
      message: "El administrador ha forzado la devolución correctamente.",
    });
  } catch (error) {
    console.error("Error en adminForceReturn:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function adminRejectReturn(req, res) {
  try {
    const { id } = req.params;
    const order = await OrderRepository.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    // VALIDACIÓN: Solo se puede rechazar si está pendiente de devolución
    if (order.status !== "DEVOLUCION_PENDIENTE") {
      return res.status(400).json({
        error: `No se puede rechazar la devolución en un pedido con estado ${order.status}.`,
      });
    }

    // Cancelamos el proceso: revertimos el estado y NO devolvemos dinero
    const { user_name, user_email, items } =
      await OrderRepository.rejectReturn(id);

    // Enviamos email al usuario indicando que la devolución ha sido rechazada
    emailService
      .sendReturnRejectedEmail(user_email, user_name, id, items)
      .catch((err) => console.error("Error enviando email de rechazo:", err));

    return res.status(200).json({
      message: "Devolución rechazada. El pedido vuelve a estar 'ENTREGADO'.",
    });
  } catch (error) {
    console.error("Error en adminRejectReturn:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  userCancelOrder,
  cancelOrder,
  getAllOrders,
  paymentAndEmail,
  confirmStripeSession,
  userRequestReturn,
  adminConfirmReturn,
  adminForceReturn,
  adminRejectReturn,
};
