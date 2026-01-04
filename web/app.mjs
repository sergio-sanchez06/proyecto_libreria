import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import webRoutes from "./routes/webRoutes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos de public/
app.use(express.static(path.join(__dirname, "public")));

app.use("/", webRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Web corriendo en http://localhost:${port}`);
});