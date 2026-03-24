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
    // Nota: No usamos BEGIN/COMMIT aquí porque es una sola sentencia ON CONFLICT (atómica por defecto)
    const result = await client.query(
      `
    INSERT INTO public.users (
      firebase_uid, email, name, role, default_address, optional_address
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (firebase_uid) DO UPDATE SET
      email = EXCLUDED.email,
      -- IMPORTANTE: Aquí es donde decides si el nombre de Google sobreescribe al de la BBDD
      name = EXCLUDED.name, 
      
      role = CASE 
               WHEN public.users.role = 'ADMIN' THEN 'ADMIN' 
               ELSE EXCLUDED.role 
             END,

      default_address = CASE 
                          WHEN public.users.default_address = 'Pendiente de completar' THEN EXCLUDED.default_address
                          ELSE public.users.default_address 
                        END,

      optional_address = COALESCE(public.users.optional_address, EXCLUDED.optional_address),
      updated_at = NOW()
    RETURNING *
  `,
      [firebase_uid, email, name, role, default_address, optional_address],
    );

    return new UserModel(result.rows[0]);
  } catch (error) {
    console.error("Error en upsertFromFirebase:", error);
    throw error;
  } finally {
    client.release();
  }
}

// async function upsertFromFirebase({
//   firebase_uid,
//   email,
//   name,
//   role = "CLIENT",
//   default_address = "Pendiente de completar",
//   optional_address = null,
// }) {
//   const client = await pool.connect();
//   try {
//     const result = await client.query(
//       `
//         INSERT INTO public.users (
//           firebase_uid, email, name, role, default_address, optional_address
//         ) VALUES ($1, $2, $3, $4, $5, $6)
//         ON CONFLICT (firebase_uid) DO UPDATE SET
//           email = EXCLUDED.email,
//           name = EXCLUDED.name,
//           role = EXCLUDED.role,
//           default_address = EXCLUDED.default_address,
//           optional_address = EXCLUDED.optional_address,
//           updated_at = NOW()
//         RETURNING *
//         `,
//       [firebase_uid, email, name, role, default_address, optional_address]
//     );

//     return new UserModel(result.rows[0]);
//   } finally {
//     client.release();
//   }
// }

async function getUserByFirebaseUid(firebase_uid) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE firebase_uid = $1",
      [firebase_uid],
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } catch (error) {
    console.error("Error en getUserByFirebaseUid:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE id = $1",
      [id],
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } catch (error) {
    console.error("Error en getUserById:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email],
    );
    return result.rows.length ? new UserModel(result.rows[0]) : null;
  } catch (error) {
    console.error("Error en getUserByEmail:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAllUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users ORDER BY created_at DESC",
    );
    return result.rows.map((row) => new UserModel(row));
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function updateProfile(updates) {
  const { id, name, default_address, optional_address, role } = updates || {};
  if (!id) throw new Error("ID del usuario requerido");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
      [name, default_address, optional_address, role, id],
    );

    if (result.rowCount === 0) {
      throw new Error("Usuario no encontrado");
    }
    await client.query("COMMIT");
    return new UserModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
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
    const res = await client.query(
      "SELECT firebase_uid FROM public.users WHERE id = $1",
      [id],
    );

    if (res.rowCount === 0) throw new Error("Usuario no encontrado");

    const firebase_uid = res.rows[0].firebase_uid;
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
  getUserById,
  getUserByFirebaseUid,
  getUserByEmail,
  getAllUsers,
  updateProfile,
  deleteUser,
};
