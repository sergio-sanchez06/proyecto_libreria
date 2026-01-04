class BookAuthorController {
  constructor() {
    this.apiUrl = "http://localhost:3000/book_authors";
  }

  // Obtener todas las relaciones
  async getAll() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching book-author relations:", error);
      throw error;
    }
  }

  // Crear relación
  async create(relationData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relationData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating book-author relation:", error);
      throw error;
    }
  }

  // Eliminar relación entre libro y autor
  async delete(bookId, authorId) {
    try {
      const query = `?book_id=${bookId}&author_id=${authorId}`;
      const response = await fetch(`${this.apiUrl}${query}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting book-author relation:`, error);
      throw error;
    }
  }
}

export default new BookAuthorController();
