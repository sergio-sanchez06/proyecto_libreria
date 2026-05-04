export default class UserFavoriteGenre {
  constructor({ user_id, genre_id, genre_name, created_at } = {}) {
    this.user_id = user_id;
    this.genre_id = genre_id;
    this.genre_name = genre_name;
    this.created_at = created_at;
  }
}
