export class Publisher {
  constructor({ id, name, country, created_at } = {}) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.created_at = created_at;
  }
}
