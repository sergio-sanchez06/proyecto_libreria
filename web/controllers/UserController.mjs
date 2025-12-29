class UserController {
  constructor() {
    this.apiUrl = "http://localhost:3000/users";
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Obtener un usuario por su ID
  async getUserById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  async createUser(userData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Actualizar un usuario existente
  async updateUser(id, userData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Renderizar usuarios en el contenedor especificado
  async renderUsers(containerId = "user-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const users = await this.getAllUsers();
      container.innerHTML = "";

      if (users.length === 0) {
        container.innerHTML = "<p>No users found.</p>";
        return;
      }

      users.forEach((user) => {
        const div = document.createElement("div");
        div.className = "user-card";
        div.innerHTML = `
                    <h3>${user.name}</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role || "User"}</p>
                    <div class="actions">
                        <button onclick="window.editUser(${
                          user.id
                        })">Edit</button>
                        <button onclick="window.deleteUser(${
                          user.id
                        })">Delete</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading users.</p>";
    }
  }
}

export default new UserController();
