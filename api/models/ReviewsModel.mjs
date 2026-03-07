export default class Review {
  constructor({
    id,
    book_id,
    user_id,
    rating,
    comment,
    created_at,
    updated_at,
  } = {}) {
    this.id = id;
    this.book_id = book_id;
    this.user_id = user_id;
    this.rating = rating;
    this.comment = comment;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
