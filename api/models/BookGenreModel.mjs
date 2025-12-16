export default class BookGenre {
  constructor({ id, book_id, genre_id, created_at, updated_at } = {}) {
    this.id = id;
    this.book_id = book_id;
    this.genre_id = genre_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
