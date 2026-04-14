import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20, // este es nuestro máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Probar con un intento de conexión mas largo con supabase
  ssl: {
    // 'rejectUnauthorized: false' es vital para entornos de desarrollo
    // permite conectar sin necesidad de un archivo de certificado local (.crt)
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Pool de PostgreSQL conectado correctamente");
    client.release();
  })
  .catch((err) => {
    console.error("⚠️ Error al calentar el pool de PostgreSQL:", err.message);
  });

export default pool;
