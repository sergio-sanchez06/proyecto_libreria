export default class BookAuthor {
  constructor({
    book_id,
    author_id,
    book = null,
    author = null,
    created_at,
    update_at,
  } = {}) {
    this.book_id = book_id;
    this.author_id = author_id;
    this.book = book;
    this.author = author;
    this.created_at = created_at;
    this.update_at = update_at;
  }
}
