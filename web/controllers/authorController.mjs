import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await apiClient.get(`/authors/${id}`);
    const author = response.data;
    const booksResponse = await apiClient.get(
      `/bookAuthor/author/${author.name}`
    );
    const books = booksResponse.data;
    console.log(books);
    // console.log(books);
    res.render("autor_detalle", { author, books });
  } catch (error) {
    console.error("Error al obtener el autor:", error);
    res.status(500).send("Error al obtener el autor");
  }
};

export default {
  getAuthorById,
};
