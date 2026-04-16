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
import reviewRoutes from "./routes/reviewRouter.mjs";
import controlUserAgent from "./middlewares/controlUserAgent.mjs";
import i18next from "i18next";
import i18nextHttpMiddleware from "i18next-http-middleware";
import i18nextFsBackend from "i18next-fs-backend";
import * as useragent from "express-useragent";
import cookieParser from "cookie-parser";
import redis from "./controllers/RedisController.mjs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware de detección de User Agent
app.use(useragent.express());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos de public/
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
    preload: ["es", "ca", "gl", "eu", "mu", "an"],
    fallbackLng: "es",
    ns: ["es", "ca", "gl", "eu", "mu", "an"], // <--- Añade los nombres de tus archivos aquí
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

// Middleware para detectar el User Agent y filtrar los accesos de agentes de IA
app.use(controlUserAgent.filterIA);
// app.use(controlUserAgent.apiLimiter);



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
app.use("/review", reviewRoutes);

await redis.startRedis();

const port = 3001;
app.listen(port, () => {
  console.log(`Web corriendo en http://localhost:${port}`);
});
