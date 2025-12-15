import admin from "../config/firebase.mjs";
import pool from "../config/database.mjs";

export const verifyTokenAndSyncUser = async (token) => {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decoded;

    const { rows } = await pool.query(
      `
        
        INSERT INTO users (firebase_uid, email, name, default_address, optional_address)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
        RETURNING *;
        
    `,
      [uid, email, name || "Usuario", "Dirección predeterminada", null]
    );

    return rows[0];
  } catch (error) {
    throw new Error("Error al verificar el token");
  }
};
