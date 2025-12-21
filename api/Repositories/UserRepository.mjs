// repositories/UserRepository.mjs
import UserModel from "../models/UserModel.mjs";
import pool from "../config/database.mjs";

async function upsertFromFirebase({
  firebase_uid,
  email,
  name,
  role = "CLIENT",
  default_address = "Pendiente de completar",
  optional_address = null,
}) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
        INSERT INTO public.users (
          firebase_uid, email, name, role, default_address, optional_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          default_address = EXCLUDED.default_address,
          optional_address = EXCLUDED.optional_address,
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
    const result = await client.query(
      "SELECT * FROM public.users ORDER BY created_at DESC"
    );
    return result.rows.map((row) => new UserModel(row));
  } finally {
    client.release();
  }
}

async function updateProfile(updates) {
  const { id, name, default_address, optional_address, role } = updates || {};

  if (!id) throw new Error("ID del usuario requerido");

  const client = await pool.connect();
  try {
    client.query("BEGIN");
    const result = await client.query(
      `
      UPDATE public.users
      SET
        name = COALESCE(NULLIF($1, ''), name),
        default_address = COALESCE(NULLIF($2, ''), default_address),
        optional_address = COALESCE(NULLIF($3, ''), optional_address),
        role = COALESCE($4, role),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [name, default_address, optional_address, role, id]
    );

    if (result.rowCount === 0) {
      throw new Error("Usuario no encontrado");
    }
    client.query("COMMIT");
    return new UserModel(result.rows[0]);
  } catch (error) {
    client.query("ROLLBACK");
    console.error("Error actualizando usuario:", error);
    throw error;
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

    return { firebase_uid };
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
  updateProfile,
  deleteUser,
};
