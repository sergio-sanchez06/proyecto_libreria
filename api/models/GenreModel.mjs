export default class Genre {
  constructor({ id, name, created_at, updated_at, deleted_at } = {}) {
    this.id = id;
    this.name = name;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }
}
