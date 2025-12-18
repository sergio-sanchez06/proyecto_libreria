import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRouter from "./routes/authRouter.mjs";
// importa otros routers si los tienes (authorRouter, genreRouter, etc.)

const port = 3001;

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());                    // Para peticiones JSON
app.use(express.urlencoded({ extended: true })); // Para form-urlencoded (Thunder Client)

// ¡¡¡SERVIR ARCHIVOS ESTÁTICOS DE LA CARPETA PUBLIC!!!
// La carpeta public debe estar al mismo nivel que api/ (o ajusta la ruta si es diferente)
app.use(express.static(path.join(__dirname, "../public")));

// Rutas API
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/books", bookRouter);
// app.use("/authors", authorRouter);
// app.use("/genres", genreRouter);
// etc.

// Ruta catch-all para que cualquier URL no-API sirva index.html (ideal para SPA)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log(`Web estática servida desde la carpeta public`);
    console.log(`Prueba el login en: http://localhost:${port}/login.html`);
});