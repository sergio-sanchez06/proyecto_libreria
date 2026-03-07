<<<<<<< HEAD
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
// Servir SOLO OrderController.mjs (seguridad mejorada - no exponer todos los controllers)
app.get("/js-controllers/OrderController.mjs", (req, res) => {
  res.sendFile(path.join(__dirname, "controllers", "OrderController.mjs"));
});

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
=======
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import webRoutes from "./routes/webRoutes.mjs";
import publisherRoutes from "./routes/publisherRouter.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import authorRoutes from "./routes/authorRouter.mjs";
import genreRoutes from "./routes/genresRouter.mjs";
import bookRoutes from "./routes/bookRoutes.mjs";
import cartRoutes from "./routes/cartRouter.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import controlUserAgent from "./middlewares/controlUserAgent.mjs";
import i18next from "i18next";
import i18nextHttpMiddleware from "i18next-http-middleware";
import i18nextFsBackend from "i18next-fs-backend";

import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware para detectar el User Agent y filtrar los accesos de agentes de IA
app.use(controlUserAgent.filterUserAgent);

// Servir archivos estáticos de public/
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "tu-secret-super-seguro",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(cookieParser("tu-secret-super-seguro"));

// Configuración de i18next para la internacionalización entre los idiomas oficiales de España
i18next
  .use(i18nextFsBackend)
  .use(i18nextHttpMiddleware.LanguageDetector)
  .init({
    preload: ["es", "ca", "gl", "eu"],
    fallbackLng: "es",
    ns: ["es", "ca", "gl", "eu"], // <--- Añade los nombres de tus archivos aquí
    defaultNS: "es", // <--- El archivo por defecto es es.json
    backend: {
      loadPath: path.join(__dirname, "locales/{{lng}}.json"),
    },
    detection: {
      order: ["querystring", "cookie", "header"], // Dónde busca el idioma primero
      lookupCookie: "i18next",
      caches: ["cookie"], // Guarda la elección en una cookie
    },
  });

// Middleware para manejar la internacionalización
app.use(i18nextHttpMiddleware.handle(i18next));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // disponible en TODAS las vistas
  res.locals.currentLanguage = req.i18n.language; // disponible en TODAS las vistas
  next();
});

app.use("/", webRoutes);
app.use("/admin", adminRoutes);
app.use("/publisher", publisherRoutes);
// app.use("/auth", authRoutes);
app.use("/books", bookRoutes);
app.use("/user", userRoutes);
app.use("/authors", authorRoutes);
app.use("/genres", genreRoutes);
app.use("/cart", cartRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Web corriendo en http://localhost:${port}`);
>>>>>>> api
});
