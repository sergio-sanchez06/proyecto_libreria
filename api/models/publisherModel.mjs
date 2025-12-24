export default class Publisher {
  constructor({
    id,
    name,
    country,
    website,
    created_at,
    update_at,
    image_url,
    descripcion,
  } = {}) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.website = website;
    this.created_at = created_at;
    this.update_at = update_at;
    this.image_url = image_url;
    this.descripcion = descripcion;
  }
}
