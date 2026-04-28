import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { RedisStore } from "connect-redis";
import i18next, { dir } from "i18next";
import i18nextHttpMiddleware from "i18next-http-middleware";
import i18nextFsBackend from "i18next-fs-backend";
import * as useragent from "express-useragent";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

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

// 2. Construir la ruta usando path.resolve (esto arregla el problema de Windows)
const envPath = path.resolve(__dirname, "../api/config/.env");

dotenv.config({ path: envPath });

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error("💥 SESSION_SECRET no definido en .env");
  process.exit(1);
}

// Refactorización del código para inicializar los servicios web y redis.

async function startApp() {
  try {
    // 1. Inicialización de Redis a través del controlador
    const redisClient = await redisController.returnRedisClient();
    console.log("✅ Redis inicializado y conectado correctamente");

    const app = express();

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              "https://cdn.jsdelivr.net",
              "https://www.gstatic.com",
              "https://www.googleapis.com",
              "https://apis.google.com",
              "https://js.stripe.com",
              "https://code.jquery.com",
              "https://*.firebaseapp.com",
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdn.jsdelivr.net",
              "https://fonts.googleapis.com",
            ],
            imgSrc: [
              "'self'",
              "data:",
              "https:",
              "https://lh3.googleusercontent.com", // Fotos perfil Google
            ],
            connectSrc: [
              "'self'",
              "https://identitytoolkit.googleapis.com",
              "https://securetoken.googleapis.com",
              "https://accounts.google.com",
              "https://oauth2.googleapis.com",
              "https://api.stripe.com",
              "https://cdn.jsdelivr.net",
              "https://www.gstatic.com",
              "https://api.twitter.com",
            ],
            frameSrc: [
              "'self'",
              "https://js.stripe.com",
              "https://*.firebaseapp.com",
              "https://accounts.google.com",
              "https://libreria-ed6c0.firebaseapp.com",
              "https://twitter.com",
              "https://api.twitter.com",
            ],
            fontSrc: [
              "'self'",
              "https://cdn.jsdelivr.net",
              "https://fonts.gstatic.com",
            ],
          },
        },
        // CONFIGURACIÓN DE POLÍTICAS DE ORIGEN (Clave para Popups)
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Permite comunicación con el popup de Google
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite cargar recursos de otros dominios
      }),
    );

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
        initImmediate: false,
        preload: ["es", "ca", "gl", "eu", "mu", "an"],
        fallbackLng: "es",
        ns: ["es", "ca", "gl", "eu", "mu", "an"],
        defaultNS: "es",
        backend: {
          loadPath: path.join(__dirname, "locales/{{lng}}.json"),
        },
        detection: {
          // Prioridad: 1. URL (?lng=), 2. Sesión (vía middleware), 3. Cookie
          order: ["querystring", "session", "cookie", "header"],
          lookupQuerystring: "lng",
          lookupCookie: "i18next",
          caches: ["cookie"], // i18next-http-middleware manejará la cookie automáticamente
        },
      });

    app.use(i18nextHttpMiddleware.handle(i18next));

    console.log("Idiomas cargados:", i18next.languages);
    console.log("Ruta de búsqueda:", path.join(__dirname, "locales/eu.json"));

    // 6. Middlewares de lógica de negocio y variables locales
    app.use(controlUserAgent.filterIA);

    app.use((req, res, next) => {
      // Capturar cambio de idioma por URL
      const queryLng = req.query.lng;

      if (queryLng) {
        req.session.lang = queryLng;
        req.i18n.changeLanguage(queryLng);
      }
      // Si no hay query, buscar idioma en sesión de redis
      else if (req.session.lang) {
        req.i18n.changeLanguage(req.session.lang);
      }

      // Definimos variables globales para las vistas
      res.locals.t = req.t;
      res.locals.i18n = req.i18n;
      res.locals.currentLanguage = req.i18n.language;
      res.locals.user = req.session.user || null;

      // 4. Lógica para currentUrl (evitando que se guarde la propia ruta de cambio de idioma)
      if (req.originalUrl.includes("/language")) {
        res.locals.currentUrl = req.session.lastUrl || "/";
      } else {
        res.locals.currentUrl = req.originalUrl;
        req.session.lastUrl = req.originalUrl; // Guardamos en sesión la última página "real"
      }

      next();
    });

    app.use((req, res, next) => {
      if (req.session.flash) {
        const { type, message } = req.session.flash;
        if (type === "success") res.locals.success = message;
        if (type === "error") res.locals.error = message;
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
    const port = 3001;
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
