// ****************************************************
// PASO 1: IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ****************************************************
import express from "express";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import session from "express-session";
import { fileURLToPath } from "url";

// Rutas de la web
import webRoutes from "./routes/webRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import genreRoutes from "./routes/genreRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publisherRoutes from "./routes/publisherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookAuthorRoutes from "./routes/bookAuthorRoutes.js";

// Cargar variables de entorno
dotenv.config();

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pg;

// ****************************************************
// PASO 2: CONFIGURACIÓN DEL SERVIDOR Y BASE DE DATOS
// ****************************************************
const PORT = process.env.PORT || 3001;
const app = express();

// Configuración de la conexión a la Base de Datos (Supabase)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }, // Supabase requiere SSL activado
});

// Probar conexión
pool
  .connect()
  .then((client) => {
    console.log("Conexión exitosa a la base de datos");
    client.release();
  })
  .catch((err) =>
    console.error("Error de conexión con la base de datos:", err.stack)
  );

// Compartir la pool con toda la aplicación
app.locals.db = pool;

// ****************************************************
// PASO 3: MIDDLEWARES (Procesamiento de datos)
// ****************************************************
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "CLAVE_SECRETA",
    resave: false,
    saveUninitialized: true,
  })
);

// ****************************************************
// PASO 4: MOTOR DE VISTAS Y ARCHIVOS ESTÁTICOS
// ****************************************************
app.set("view engine", "ejs");
// Apuntamos a la carpeta 'views' dentro de 'web'
app.set("views", path.join(__dirname, "views"));
// Apuntamos a la carpeta 'public' para CSS e imágenes
app.use(express.static(path.join(__dirname, "public")));
// Permitimos que el navegador acceda a los controllers (como OrderController.mjs)
app.use("/js-controllers", express.static(path.join(__dirname, "controllers")));

// ****************************************************
// PASO 5: DEFINICIÓN DE RUTAS
// ****************************************************

// Rutas Generales
app.use("/", webRoutes);

// Rutas Específicas
app.use("/authors", authorRoutes); // Autores
app.use("/books", bookRoutes); // Libros
app.use("/genres", genreRoutes); // Géneros
app.use("/orders", orderRoutes); // Pedidos
app.use("/publishers", publisherRoutes); // Editoriales
app.use("/users", userRoutes); // Perfiles y usuarios
app.use("/book-authors", bookAuthorRoutes); // Relaciones Libro-Autor
app.use("/auth", authRoutes); // Autenticación (Login/Registro)

// ****************************************************
// PASO 6: INICIAR EL SERVIDOR
// ****************************************************
app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`);
});
