// repositories/UserRepository.mjs
import UserModel from "../models/UserModel.mjs";
import pool from "../config/database.mjs";

async function upsertFromFirebase({
  // Metodo que inserta un usuario en ambas bases de datos
  firebase_uid,
  email,
  name,
  role,
  default_address,
  optional_address,
}) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        INSERT INTO public.users (firebase_uid, email, name, role, default_address, optional_address)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
        `,
      [firebase_uid, email, name, role, default_address, optional_address]
    );
    return new UserModel(result.rows[0]);
  } finally {
    client.release();
  }
}

async function getById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE id = $1",
      [id]
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function getUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function getAllUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM public.users");
    return result.rows.map((row) => new UserModel(row));
  } finally {
    client.release();
  }
}

async function update(id, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.name) {
    fields.push(`name = $${index++}`);
    values.push(updates.name);
  }
  if (updates.default_address) {
    fields.push(`default_address = $${index++}`);
    values.push(updates.default_address);
  }
  if (updates.optional_address !== undefined) {
    fields.push(`optional_address = $${index++}`);
    values.push(updates.optional_address);
  }
  if (updates.role) {
    fields.push(`role = $${index++}`);
    values.push(updates.role);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE public.users SET ${fields.join(
        ", "
      )} WHERE id = $${index} RETURNING *`,
      values
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function deleteUser(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const uidResult = await client.query(
      "SELECT firebase_uid FROM public.users WHERE id = $1",
      [id]
    );

    if (uidResult.rowCount === 0) throw new Error("Usuario no encontrado");

    const firebase_uid = uidResult.rows[0].firebase_uid;

    await client.query("DELETE FROM public.users WHERE id = $1", [id]);

    await client.query("COMMIT");

    return { firebase_uid }; // para cleanup si quieres
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  upsertFromFirebase,
  getById,
  getUserByEmail,
  getAllUsers,
  update,
  deleteUser,
};
