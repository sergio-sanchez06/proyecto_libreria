class AuthorController {
  constructor() {
    this.apiUrl = "http://localhost:3000/authors";
  }

  // Listar todos los autores
  async getAllAuthors() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching authors:", error);
      throw error;
    }
  }

  // Obtener detalles de un autor específico
  async getAuthorById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching author ${id}:`, error);
      throw error;
    }
  }

  // Crear autor
  async createAuthor(authorData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authorData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating author:", error);
      throw error;
    }
  }

  // Actualizar datos del autor
  async updateAuthor(id, authorData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authorData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating author ${id}:`, error);
      throw error;
    }
  }

  // Borrar autor
  async deleteAuthor(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting author ${id}:`, error);
      throw error;
    }
  }

  // Mostrar autores en el DOM
  async renderAuthors(containerId = "author-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const authors = await this.getAllAuthors();
      container.innerHTML = "";

      if (authors.length === 0) {
        container.innerHTML = "<p>No authors found.</p>";
        return;
      }

      authors.forEach((author) => {
        const div = document.createElement("div");
        div.className = "author-card";
        div.innerHTML = `
                    <img src="${
                      author.photo_url || "https://via.placeholder.com/150"
                    }" alt="${author.name}">
                    <h3>${author.name}</h3>
                    <p><strong>Country:</strong> ${author.country}</p>
                    <div class="actions">
                        <button onclick="window.editAuthor(${
                          author.id
                        })">Edit</button>
                        <button onclick="window.deleteAuthor(${
                          author.id
                        })">Delete</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading authors.</p>";
    }
  }
}

export default new AuthorController();
