import AuthService from "../services/authService.mjs";

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado - Token faltante" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const user = await AuthService.verifyTokenAndGetUser(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "No autorizado - Token inválido" });
  }
}

async function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "No autorizado - Rol insuficiente" });
  }
  next();
}

export default {
  authenticate,
  requireAdmin,
};
