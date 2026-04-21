// repositories/UserRepository.mjs
import UserModel from "../models/UserModel.mjs";
import pool from "../config/database.mjs";

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
//     // Nota: No usamos BEGIN/COMMIT aquí porque es una sola sentencia ON CONFLICT (atómica por defecto)
//     const result = await client.query(
//       `
//     INSERT INTO public.users (
//       firebase_uid, email, name, role, default_address, optional_address
//     ) VALUES ($1, $2, $3, $4, $5, $6)
//     ON CONFLICT (firebase_uid) DO UPDATE SET
//       email = EXCLUDED.email,
//       -- IMPORTANTE: Aquí es donde decides si el nombre de Google sobreescribe al de la BBDD
//       name = EXCLUDED.name,

//       role = CASE
//                WHEN public.users.role = 'ADMIN' THEN 'ADMIN'
//                ELSE EXCLUDED.role
//              END,

//       default_address = CASE
//                           WHEN public.users.default_address = 'Pendiente de completar' THEN EXCLUDED.default_address
//                           ELSE public.users.default_address
//                         END,

//       optional_address = COALESCE(public.users.optional_address, EXCLUDED.optional_address),
//       updated_at = NOW()
//     RETURNING *
//   `,
//       [firebase_uid, email, name, role, default_address, optional_address],
//     );

//     return new UserModel(result.rows[0]);
//   } catch (error) {
//     console.error("Error en upsertFromFirebase:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

//Actualizacion de la funcion upsertFromFirebase para que no se sobreescriba el nombre del usuario

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
    // 1. VERIFICACIÓN DE CUENTA DESACTIVADA
    const checkRes = await client.query(
      "SELECT deleted_at FROM public.users WHERE firebase_uid = $1",
      [firebase_uid],
    );

    if (checkRes.rowCount > 0 && checkRes.rows[0].deleted_at !== null) {
      const error = new Error("Cuenta desactivada. Contacte con soporte.");
      error.status = 403;
      throw error;
    }

    // 2. UPSERT CON DETECCIÓN DE NUEVO REGISTRO
    const result = await client.query(
      `
      INSERT INTO public.users (
        firebase_uid, email, name, role, default_address, optional_address
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (firebase_uid) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW(),
        name = CASE 
                 WHEN public.users.name IS NULL OR public.users.name = '' 
                 THEN EXCLUDED.name ELSE public.users.name 
               END,
        -- LOGICA IMPORTANTE: Si la dirección actual es la de por defecto, 
        -- intentamos actualizarla con lo que venga de EXCLUDED (por si viene de Google)
        default_address = CASE
                            WHEN public.users.default_address = 'Pendiente de completar'
                            THEN EXCLUDED.default_address
                            ELSE public.users.default_address
                          END
      RETURNING *, (xmax = 0) AS is_inserted;
      `,
      [firebase_uid, email, name, role, default_address, optional_address],
    );

    const userData = result.rows[0];

    /* LÓGICA DE NEGOCIO PARA isNewUser:
       Un usuario es "Nuevo" para el sistema si:
       1. Se acaba de insertar (is_inserted)
       2. O si su dirección sigue siendo 'Pendiente de completar' (aunque ya existiera el mail)
    */
    const isNewUser =
      userData.is_inserted ||
      userData.default_address === "Pendiente de completar";

    return {
      user: new UserModel(userData),
      isNewUser: isNewUser,
    };
  } catch (error) {
    console.error("Error en upsertFromFirebase:", error.message);
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
//     // 1. VERIFICACIÓN PREVIA: ¿Está el usuario en "Soft Delete"?
//     const checkRes = await client.query(
//       "SELECT deleted_at FROM public.users WHERE firebase_uid = $1",
//       [firebase_uid],
//     );

//     if (checkRes.rowCount > 0 && checkRes.rows[0].deleted_at !== null) {
//       // Si el usuario existe pero está borrado, lanzamos error
//       // Esto impedirá que el login continúe
//       const error = new Error(
//         "Cuenta desactivada. Contacte con soporte para reactivarla.",
//       );
//       error.status = 403; // Forbidden
//       throw error;
//     }

//     // 2. Si no está borrado (o no existe), procedemos con el INSERT/UPDATE normal
//     const result = await client.query(
//       `
//       INSERT INTO public.users (
//         firebase_uid, email, name, role, default_address, optional_address
//       ) VALUES ($1, $2, $3, $4, $5, $6)
//       ON CONFLICT (firebase_uid) DO UPDATE SET
//         email = EXCLUDED.email,
//         updated_at = NOW(),
//         -- Mantenemos el resto de tu lógica de protección de datos...
//         name = CASE
//                  WHEN public.users.name IS NULL OR public.users.name = ''
//                  THEN EXCLUDED.name
//                  ELSE public.users.name
//                END,
//         role = CASE
//                  WHEN public.users.role = 'ADMIN' THEN 'ADMIN'
//                  ELSE public.users.role
//                END,
//         default_address = CASE
//                             WHEN public.users.default_address IS NULL
//                               OR public.users.default_address = 'Pendiente de completar'
//                             THEN EXCLUDED.default_address
//                             ELSE public.users.default_address
//                           END
//       RETURNING *, (xmax = 0) as is_new_user
//       `,
//       [firebase_uid, email, name, role, default_address, optional_address],
//     );

//     const userData = result.rows[0];
//     return {
//       user: new UserModel(userData),
//       isNewUser: userData.is_new_user,
//     };
//   } catch (error) {
//     console.error("Error en upsertFromFirebase:", error.message);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

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
//       INSERT INTO public.users (
//         firebase_uid, email, name, role, default_address, optional_address
//       ) VALUES ($1, $2, $3, $4, $5, $6)
//       ON CONFLICT (firebase_uid) DO UPDATE SET
//         -- Email se sincroniza siempre — puede cambiar en Firebase
//         email = EXCLUDED.email,
//         -- 2. REACTIVACIÓN: Si el usuario vuelve, quitamos la marca de borrado
//         deleted_at = NULL,

//         -- Nombre: solo se escribe en el INSERT inicial, nunca se sobreescribe
//         -- Si el usuario lo cambió en su perfil, se respeta
//         name = CASE
//                  WHEN public.users.name IS NULL OR public.users.name = ''
//                  THEN EXCLUDED.name
//                  ELSE public.users.name
//                END,

//         -- Rol: ADMIN nunca se degrada
//         role = CASE
//                  WHEN public.users.role = 'ADMIN' THEN 'ADMIN'
//                  ELSE public.users.role  -- ← conserva el rol actual, no lo sobreescribe
//                END,

//         -- Dirección: solo se rellena si estaba vacía o pendiente
//         default_address = CASE
//                             WHEN public.users.default_address IS NULL
//                               OR public.users.default_address = 'Pendiente de completar'
//                             THEN EXCLUDED.default_address
//                             ELSE public.users.default_address
//                           END,

//         optional_address = COALESCE(public.users.optional_address, EXCLUDED.optional_address),

//         updated_at = NOW()
//       RETURNING *, (xmax = 0) as is_new_user
//       `,
//       [firebase_uid, email, name, role, default_address, optional_address],
//     );

//     const userData = result.rows[0];
//     return {
//       user: new UserModel(userData),
//       isNewUser: userData.is_new_user, // Extraemos la bandera para ver si el usuario es nuevo a través de google o X
//     };
//   } catch (error) {
//     console.error("Error en upsertFromFirebase:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

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
    console.error("Error en getUserById:", error.message);
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
        name = COALESCE(NULLIF($1, ''), name), -- Obligatorio: si viene vacío, no cambia
        default_address = COALESCE(NULLIF($2, ''), default_address), -- Obligatorio
        optional_address = $3, -- OPCIONAL: Se guarda exactamente lo que envíe el usuario (vacío o texto)
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

// async function deleteUser(id) {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");
//     const res = await client.query(
//       "SELECT firebase_uid FROM public.users WHERE id = $1",
//       [id],
//     );

//     if (res.rowCount === 0) throw new Error("Usuario no encontrado");

//     const firebase_uid = res.rows[0].firebase_uid;
//     await client.query("DELETE FROM public.users WHERE id = $1", [id]);
//     await client.query("COMMIT");

//     return { firebase_uid };
//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }

async function disableUser(id) {
  const cliente = await pool.connect();

  try {

    await cliente.query("BEGIN");

    const query = `Update users set deleted_at = NOW(), updated_at = Now() where id = $1 returning firebase_uid;`;

    const result = await cliente.query(query, [id]);

    if (result.rowCount === 0) {
      throw new Error("Usuario no encontrado");
    }
    await cliente.query("COMMIT");
    return result.rows[0].firebase_uid;
  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error("Error desactivando usuario:", error);
    throw error;
  } finally {
    cliente.release();
  }
}

async function deleteUserAndAnonimaze(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Primero recuperamos el UID para Firebase
    const findRes = await client.query(
      "SELECT firebase_uid FROM public.users WHERE id = $1",
      [id],
    );
    if (findRes.rowCount === 0) throw new Error("Usuario no encontrado");
    const firebase_uid = findRes.rows[0].firebase_uid;

    const query = `Update users set name = 'Usuario Eliminado',
    email = $1, 
    default_address = 'Dirección Eliminada', 
    optional_address = NULL, 
    firebase_uid = $2, 
    deleted_at = NOW(), 
    updated_at = NOW() 
    where id = $3 
    returning firebase_uid;`;

    //Implementación para cumplir con las restricciones de valor unico (unique) definidas sobre email y firebase_uid
    const anonEmail = `deleted_${id}@internal.system`;
    const anonFirebase = `deleted_${id}_${Date.now()}`;

    const result = await client.query(query, [anonEmail, anonFirebase, id]);

    if (result.rowCount === 0) {
      throw new Error("Usuario no encontrado");
    }

    await client.query("COMMIT");
    return firebase_uid;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error desactivando usuario:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function restoreUser(id) {
  const client = await pool.connect();

  try {
    const query = `UPDATE users
      set deleted_at = NULL, updated_at = NOW()
      where id = $1
      RETURNING firebase_uid;`;

    const result = await client.query(query, [id]);

    if (result.rowCount === 0) {
      throw new Error("Usuario no encontrado en la base de datos");
    }

    return result.rows[0].firebase_uid;
  } catch (error) {
    console.error("Error restaurando usuario:", error);
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
  deleteUserAndAnonimaze,
  disableUser,
  restoreUser,
  // deleteUser,
};
