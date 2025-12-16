export default class Author {
  constructor({ id, name, country, photo_url, created_at, update_at } = {}) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.photo_url = photo_url;
    this.created_at = created_at;
    this.update_at = update_at;
  }
}
