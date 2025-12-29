class PublisherController {
  constructor() {
    this.apiUrl = "http://localhost:3000/publishers";
  }

  async getAllPublishers() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching publishers:", error);
      throw error;
    }
  }

  async getPublisherById(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching publisher ${id}:`, error);
      throw error;
    }
  }

  async createPublisher(publisherData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publisherData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating publisher:", error);
      throw error;
    }
  }

  async updatePublisher(id, publisherData) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publisherData),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating publisher ${id}:`, error);
      throw error;
    }
  }

  async deletePublisher(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error deleting publisher ${id}:`, error);
      throw error;
    }
  }

  async renderPublishers(containerId = "publisher-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const publishers = await this.getAllPublishers();
      container.innerHTML = "";

      if (publishers.length === 0) {
        container.innerHTML = "<p>No publishers found.</p>";
        return;
      }

      publishers.forEach((publisher) => {
        const div = document.createElement("div");
        div.className = "publisher-card";
        div.innerHTML = `
                    <h3>${publisher.name}</h3>
                    <p><strong>Country:</strong> ${publisher.country}</p>
                    <div class="actions">
                        <button onclick="window.editPublisher(${publisher.id})">Edit</button>
                        <button onclick="window.deletePublisher(${publisher.id})">Delete</button>
                    </div>
                `;
        container.appendChild(div);
      });
    } catch (error) {
      container.innerHTML =
        "<p style='color: red;'>Error loading publishers.</p>";
    }
  }
}

export default new PublisherController();
