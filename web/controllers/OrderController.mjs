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
                    <p><strong>Total:</strong> ${order.total} €</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <div class="actions">
                        <button onclick="window.viewOrder(${order.id})">View Details</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading orders.</p>";
    }
  }
}

export default new OrderController();
