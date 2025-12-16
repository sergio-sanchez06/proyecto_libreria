export default class BookAuthor {
  constructor({ book_id, author_id, created_at, update_at } = {}) {
    this.book_id = book_id;
    this.author_id = author_id;
    this.created_at = created_at;
    this.update_at = update_at;
  }
}
