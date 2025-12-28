import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import webRoutes from "./routes/webRoutes.mjs";
import publisherRoutes from "./routes/publisherRouter.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import authorRoutes from "./routes/authorRouter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos de public/
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "tu-secret-super-seguro",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true en producción con HTTPS
  })
);

app.use("/", webRoutes);
app.use("/publishers", publisherRoutes);
app.use("/user", userRoutes);
app.use("/author", authorRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Web corriendo en http://localhost:${port}`);
});
