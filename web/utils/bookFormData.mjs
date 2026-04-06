import { getAuthenticatedClient } from "./apiClient.mjs";

export const getBookFormData = async (req) => {
  const api = getAuthenticatedClient(req.session.idToken);
  const [publishers, authors, genres] = await Promise.all([
    api.get("/publishers/allPublishers"),
    api.get("/authors"),
    api.get("/genres/all"),
  ]);

  // Si es edición, intentamos traer también los datos del libro actual
  let book = null;
  if (req.params.id) {
    const bookRes = await api.get(`/books/${req.params.id}`);
    book = bookRes.data;
  }

  return {
    publishers: publishers.data,
    authors: authors.data,
    genres: genres.data,
    book: book, // Esto es vital para la vista de edición
  };
};
