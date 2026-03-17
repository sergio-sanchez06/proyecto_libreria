export default class Review {
  constructor({
    id,
    book_id,
    user_id,
    user_email,
    rating,
    comment,
    book_title,
    book_cover,
    created_at,
    updated_at,
    deleted_at,
  } = {}) {
    this.id = id;
    this.book_id = book_id;
    this.user_id = user_id;
    this.user_email = user_email;
    this.rating = rating;
    this.comment = comment;
    this.book_title = book_title || null;
    this.book_cover = book_cover || null;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }
}
