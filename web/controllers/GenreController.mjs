class GenreController {
  constructor() {
    this.apiUrl = "http://localhost:3000/genres";
  }

  // Listar todos los géneros
  async getAllGenres() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching genres:", error);
      throw error;
    }
  }

  async getGenreById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching genre ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo género
  async createGenre(genreData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genreData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating genre:", error);
      throw error;
    }
  }

  async updateGenre(id, genreData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genreData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating genre ${id}:`, error);
      throw error;
    }
  }

  async deleteGenre(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting genre ${id}:`, error);
      throw error;
    }
  }

  // Renderizar géneros en la vista
  async renderGenres(containerId = "genre-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const genres = await this.getAllGenres();
      container.innerHTML = "";

      if (genres.length === 0) {
        container.innerHTML = "<p>No genres found.</p>";
        return;
      }

      genres.forEach((genre) => {
        const div = document.createElement("div");
        div.className = "genre-card";
        div.innerHTML = `
                    <h3>${genre.name}</h3>
                    <div class="actions">
                        <button onclick="window.editGenre(${genre.id})">Edit</button>
                        <button onclick="window.deleteGenre(${genre.id})">Delete</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML = "<p style='color: red;'>Error loading genres.</p>";
    }
  }
}

export default new GenreController();
