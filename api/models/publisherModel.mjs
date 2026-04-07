export default class Publisher {
  constructor({
    id,
    name,
    country,
    website,
    created_at,
    updated_at,
    image_url,
    descripcion,
    deleted_at,
  } = {}) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.website = website;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.image_url = image_url;
    this.descripcion = descripcion;
    this.deleted_at = deleted_at;
  }
}
