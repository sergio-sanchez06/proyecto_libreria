export default class Author {
  constructor({
    id,
    name,
    country,
    photo_url,
    biography,
    created_at,
    updated_at,
    deleted_at,
  } = {}) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.photo_url = photo_url;
    this.biography = biography;
    this.created_at = created_at;
    this.update_at = updated_at;
    this.deleted_at = deleted_at;
  }
}
