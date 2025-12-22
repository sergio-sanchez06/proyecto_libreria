import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ruta principal (dashboard)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/index.html"));
});

// Ruta de login
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/login.html"));
});

// Ruta de registro
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/register.html"));
});

// Ruta protegida (ej: dashboard) - opcional, si quieres redirigir desde frontend
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/dashboard.html"));
});

export default router;
