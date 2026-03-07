import Book from "./BookModel.mjs";
import Author from "./authorModel.mjs";

export default class BookAuthor {
  constructor({
    book_id,
    author_id,
    book = new Book(),
    author = new Author(),
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
