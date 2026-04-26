import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { RedisStore } from "connect-redis";
import i18next from "i18next";
import i18nextHttpMiddleware from "i18next-http-middleware";
import i18nextFsBackend from "i18next-fs-backend";
import * as useragent from "express-useragent";
import cookieParser from "cookie-parser";

// Controlador de Redis
import redisController from "./controllers/RedisController.mjs";

// Rutas
import webRoutes from "./routes/webRoutes.mjs";
import publisherRoutes from "./routes/publisherRouter.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import authorRoutes from "./routes/authorRouter.mjs";
import genreRoutes from "./routes/genresRouter.mjs";
import bookRoutes from "./routes/bookRoutes.mjs";
import cartRoutes from "./routes/cartRouter.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import reviewRoutes from "./routes/reviewRouter.mjs";

// Middlewares
import controlUserAgent from "./middlewares/controlUserAgent.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_SECRET = "tu-secret-super-seguro";


// Refactorización del código para inicializar los servicios web y redis.

async function startApp() {
  try {
    // 1. Inicialización de Redis a través del controlador
    const redisClient = await redisController.returnRedisClient();
    console.log("✅ Redis inicializado y conectado correctamente");

    const app = express();

    // 2. Configuración de Middlewares base
    app.use(useragent.express());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser(SESSION_SECRET));

    // 3. Configuración de Vistas y Estáticos
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));
    app.use(express.static(path.join(__dirname, "public")));
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // 4. Configuración de Sesión con Redis
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: "web_sessions:",
      disableTouch: false,
    });

    app.use(
      session({
        store: redisStore,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
          secure: false, // Cambiar a true si al final implementamos certificado HTTPS
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 2, // Sesión de 2 horas
        },
      }),
    );

    // 5. Configuración de i18next
    await i18next
      .use(i18nextFsBackend)
      .use(i18nextHttpMiddleware.LanguageDetector)
      .init({
        preload: ["es", "ca", "gl", "eu", "mu", "an"],
        fallbackLng: "es",
        ns: ["es", "ca", "gl", "eu", "mu", "an"],
        defaultNS: "es",
        backend: {
          loadPath: path.join(__dirname, "locales/{{lng}}.json"),
        },
        detection: {
          order: ["querystring", "cookie", "header"],
          lookupCookie: "i18next",
          caches: ["cookie"],
        },
      });

    app.use(i18nextHttpMiddleware.handle(i18next));

    // 6. Middlewares de lógica de negocio y variables locales
    app.use(controlUserAgent.filterIA);

    app.use((req, res, next) => {
      res.locals.user = req.session.user || null;
      res.locals.currentLanguage = req.i18n.language;
      next();
    });

    app.use((req, res, next) => {
      if (req.session.flash) {
        res.locals.error = req.session.flash.message;
        delete req.session.flash;
      }
      next();
    });

    // 7. Definición de Rutas
    app.use("/", webRoutes);
    app.use("/admin", adminRoutes);
    app.use("/publisher", publisherRoutes);
    app.use("/books", bookRoutes);
    app.use("/user", userRoutes);
    app.use("/authors", authorRoutes);
    app.use("/genres", genreRoutes);
    app.use("/cart", cartRoutes);
    app.use("/review", reviewRoutes);

    // 8. Manejo de errores global del proceso
    process.on("unhandledRejection", (reason) => {
      console.error("⚠️ Unhandled Rejection:", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("⚠️ Uncaught Exception:", error);
    });

    // 9. Lanzamiento del servidor
    const port = process.env.PORTWEB;
    app.listen(port, () => {
      console.log(`🚀 Web corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("💥 Error crítico durante el arranque de la app:", error);
    process.exit(1);
  }
}

// Arrancar la aplicación
startApp();
