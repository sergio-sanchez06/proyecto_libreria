export class Book {
  constructor({
    id,
    title,
    isbn,
    price,
    stock,
    releashed_year,
    format,
    language,
    pages,
    synopsis,
    cover_url,
    publisher_id,
    created_at,
    updated_at,
  } = {}) {
    this.id = id;
    this.title = title;
    this.isbn = isbn;
    this.price = price ? parseFloat(price) : null;
    this.stock = stock ? parseInt(stock) : 0;
    this.releashed_year = releashed_year;
    this.format = format;
    this.language = language;
    this.pages = pages ? parseInt(pages) : 0;
    this.synopsis = synopsis;
    this.cover_url = cover_url;
    this.publisher_id = publisher_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
