// repositories/UserRepository.mjs
import UserModel from "../models/UserModel.mjs";
import pool from "../config/database.mjs";

<<<<<<< HEAD
class UserRepository {
  /**
   * Crea o actualiza usuario desde Firebase
   * @param {object} param
   * @param {string} param.firebase_uid
   * @param {string} param.email
   * @param {string} param.name
   * @param {string} [param.role="CLIENT"]
   * @param {string} [param.default_address="Pendiente de completar"]
   * @param {string|null} [param.optional_address=null]
   */
  static async upsertFromFirebase({
    firebase_uid,
    email,
    name,
    role = "CLIENT",
    default_address = "Pendiente de completar",  // ← nunca null
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

  static async getById(id) {
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

  static async getUserByEmail(email) {
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

  static async getAllUsers() {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT * FROM public.users ORDER BY created_at DESC");
      return result.rows.map((row) => new UserModel(row));
    } finally {
      client.release();
    }
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.default_address !== undefined) {
      fields.push(`default_address = $${index++}`);
      values.push(updates.default_address || "Pendiente de completar");
    }
    if (updates.optional_address !== undefined) {
      fields.push(`optional_address = $${index++}`);
      values.push(updates.optional_address);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${index++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE public.users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`,
        values
      );
      return result.rows.length ? new UserModel(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  static async deleteUser(id) {
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
}

export default UserRepository;
=======
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
      -- El email y el nombre sí los actualizamos por si cambian en la red social
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      
      -- El ROL solo se actualiza si el valor nuevo NO es 'ADMIN' (protección de admin)
      role = CASE 
               WHEN public.users.role = 'ADMIN' THEN 'ADMIN' 
               ELSE EXCLUDED.role 
             END,

      -- Actualizamos la dirección si la actual es la de por defecto
      default_address = CASE 
                          WHEN public.users.default_address = 'Pendiente de completar' THEN EXCLUDED.default_address
                          ELSE public.users.default_address 
                        END,

      -- Mantenemos la dirección opcional si ya existe una
      optional_address = COALESCE(public.users.optional_address, EXCLUDED.optional_address),
      
      updated_at = NOW()
    RETURNING *
  `,
      [firebase_uid, email, name, role, default_address, optional_address],
    );

    return new UserModel(result.rows[0]);
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
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  console.log("Recuperando perfil del usuario en la bbdd");
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM public.users WHERE id = $1",
      [id],
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
      [email],
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
      "SELECT * FROM public.users ORDER BY created_at DESC",
    );
    return result.rows.map((row) => new UserModel(row));
  } finally {
    client.release();
  }
}

async function updateProfile(updates) {
  console.log("Actualizando perfil del usuario en la bbdd");

  console.log(updates);

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
      [name, default_address, optional_address, role, id],
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
    // Obtenemos el UID antes de borrar para devolvérselo al controlador
    const res = await client.query(
      "SELECT firebase_uid FROM public.users WHERE id = $1",
      [id],
    );

    if (res.rowCount === 0) throw new Error("Usuario no encontrado");

    const firebase_uid = res.rows[0].firebase_uid;
    await client.query("DELETE FROM public.users WHERE id = $1", [id]);
    await client.query("COMMIT");

    return { firebase_uid }; // Importante para que el controlador borre en Firebase
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
>>>>>>> api
