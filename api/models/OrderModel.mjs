export default class Order {
  constructor({
    id,
    user_id,
    total,
    status,
    stripe_payment_intent,
    created_at,
    updated_at,
    shipping_address,
  } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.total = total;
    this.status = status;
    this.stripe_payment_intent = stripe_payment_intent;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.shipping_address = shipping_address;
  }
}
