class OrderController {
  constructor() {
    this.apiUrl = "http://localhost:3000/orders";
  }

  async getAllOrders() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrder(id, orderData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  }

  async deleteOrder(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  }

  // --- GESTIÓN DEL CARRITO (LocalStorage) ---

  addToCart(book) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item.id === book.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: book.id,
        title: book.title || book.titulo,
        price: parseFloat(book.price || book.precio),
        quantity: 1,
        cover: book.cover_url || book.portada,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Libro añadido al carrito");
  }

  removeFromCart(bookId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((item) => item.id !== bookId);
    localStorage.setItem("cart", JSON.stringify(cart));
    this.renderCart(); // Re-renderizar
  }

  updateQuantity(bookId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find((i) => i.id === bookId);
    if (item) {
      item.quantity = parseInt(newQuantity);
      if (item.quantity <= 0) {
        this.removeFromCart(bookId);
        return;
      }
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    this.renderCart();
  }

  renderCart(containerId = "lista-carrito") {
    const container = document.getElementById(containerId);
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");

    if (!container) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    container.innerHTML = "";

    let total = 0;

    if (cart.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Tu carrito está vacío.</td></tr>`;
      if (subtotalEl) subtotalEl.textContent = "0.00€";
      if (totalEl) totalEl.textContent = "0.00€";
      return;
    }

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>
              <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${
                    item.cover || "/images/default-cover.jpg"
                  }" style="width:50px; height:75px; object-fit:cover;">
                  <span>${item.title}</span>
              </div>
          </td>
          <td>
              <input type="number" value="${item.quantity}" min="1" 
                     onchange="window.OrderController.updateQuantity(${
                       item.id
                     }, this.value)"
                     style="width: 60px; padding: 5px;">
          </td>
          <td>${item.price.toFixed(2)}€</td>
          <td>${itemTotal.toFixed(2)}€</td>
          <td>
              <button onclick="window.OrderController.removeFromCart(${
                item.id
              })" class="btn-danger" style="padding:5px 10px;">×</button>
          </td>
      `;
      container.appendChild(tr);
    });

    if (subtotalEl) subtotalEl.textContent = `${total.toFixed(2)}€`;
    if (totalEl) totalEl.textContent = `${total.toFixed(2)}€`;
  }

  async checkout() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    const orderData = {
      items: cart.map((item) => ({
        book_id: item.id,
        quantity: item.quantity,
      })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    try {
      await this.createOrder(orderData);
      localStorage.removeItem("cart");
      alert("¡Pedido realizado con éxito!");
      window.location.href = "/users/historial";
    } catch (error) {
      alert("Error al procesar el pedido. Asegúrate de haber iniciado sesión");
      console.error(error);
    }
  }

  // --- MÉTODOS DE VISUALIZACIÓN DE ÓRDENES (Historial) ---

  async renderOrders(containerId = "order-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const orders = await this.getAllOrders();
      container.innerHTML = "";

      if (orders.length === 0) {
        container.innerHTML = "<p>No orders found.</p>";
        return;
      }

      orders.forEach((order) => {
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
            <h3>Order #${order.id}</h3>
            <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(
              2
            )} €</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <div class="actions">
                <button onclick="window.location.href='/orders/${
                  order.id
                }'">View Details</button>
            </div>
        `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading orders.</p>";
    }
  }
}

// Exponer al window para que se pueda llamar desde el HTML (onclick)
const orderController = new OrderController();
window.OrderController = orderController;

export default orderController;
