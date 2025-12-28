import AuthService from "../services/authService.mjs";

export const register = async (req, res) => {
  // Funcion para registrar usuarios
  try {
    const user = await AuthService.registerWithEmailPassword(req.body);
    res.status(201).json({ message: "Registro exitoso", user: user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  // Funcion para iniciar sesion
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Token requerido" });

    const user = await AuthService.verifyTokenAndGetUser(idToken);
    console.log("Inicio de sesion exitoso para:", user.email);
    res.status(200).json({
      message: "Login exitoso",
      user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(401).json({ message: error.message || "Token inválido" });
  }
};
