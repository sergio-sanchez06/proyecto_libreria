import pool from "../config/database.mjs";
import BookGenreModel from "../models/BookGenreModel.mjs";

async function createBookGenre(bookGenre) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "INSERT INTO book_genre (book_id, genre_id) VALUES ($1, $2) RETURNING *",
            [bookGenre.book_id, bookGenre.genre_id]
        );
        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getBookGenreById(book_id, genre_id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query("SELECT * FROM book_genre WHERE book_id = $1 AND genre_id = $2", [
            book_id,
        ]);
        await client.query("COMMIT");
        return new BookGenreModel(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function updateBookGenre(bookGenre) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "UPDATE book_genre SET book_id = $1, genre_id = $2 WHERE id = $3 AND book_id = $4 AND genre_id = $5 RETURNING *",
            [bookGenre.book_id, bookGenre.genre_id, bookGenre.book_id, bookGenre.genre_id]
        );
        await client.query("COMMIT");
        return new BookGenreModel(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function deleteBookGenre(book_id, genre_id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM book_genre WHERE book_id = $1 AND genre_id = $2", [book_id, genre_id]);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export default {
    createBookGenre,
    getBookGenreById,
    updateBookGenre,
    deleteBookGenre,
}
