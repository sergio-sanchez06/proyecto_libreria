export default class BookGenre {
  constructor({
    id,
    book_id,
    genre_id,
    book = null,
    genre = null,
    created_at,
    updated_at,
  } = {}) {
    this.id = id;
    this.book_id = book_id;
    this.genre_id = genre_id;
    this.book = book;
    this.genre = genre;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
