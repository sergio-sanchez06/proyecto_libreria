import { verifyTokenAndSyncUser } from "../services/authService.mjs";

async function login(req, res) {
  // Controlador de login
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token no proporcionado" });
  }

  try {
    const user = await verifyTokenAndSyncUser(token);
    return res.status(200).json({ message: "Login correcto", user });
  } catch (error) {
    return res.status(401).json({ message: "Token no válido" });
  }
}

async function register(req, res) {
  // Controlador de registro
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email y password son obligatorios" });
  }

  try {
    const user = await verifyTokenAndSyncUser(token);
    return res.status(200).json({ message: "Login correcto", user });
  } catch (error) {
    return res.status(401).json({ message: "Token no válido" });
  }
}

export default {
  login,
  register,
};
