export default class User {
  constructor({
    id,
    name,
    email,
    firebase_uid,
    role,
    default_address,
    optional_address,
    created_at,
    updated_at,
  } = {}) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.firebase_uid = firebase_uid;
    this.role = role;
    this.default_address = default_address;
    this.optional_address = optional_address;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
  isAdmin() {
    return this.role === "ADMIN";
  }

  isClient() {
    return this.role === "CLIENT";
  }
}
