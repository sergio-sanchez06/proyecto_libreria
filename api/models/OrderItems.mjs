export default class OrderItems {
  constructor({
    id,
    order_id,
    book_id,
    quantity,
    price_at_time,
    created_at,
    update_at,
  } = {}) {
    this.id = id;
    this.order_id = order_id;
    this.book_id = book_id;
    this.quantity = quantity;
    this.price_at_time = price_at_time;
    this.created_at = created_at;
    this.update_at = update_at;
  }
}
