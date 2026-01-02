import AuthService from "../services/authService.mjs";

export const register = async (req, res) => {
  console.log("Registrando usuario");
  console.log(req.body);

  console.log("Registrando usuario", req.body);

  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ message: "Registro exitoso", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// export const register = async (req, res) => {
//   console.log("Registrando usuario");
//   console.log(req.body);

//   console.log("Registrando usuario", req.body);

//   const { idToken, name, email, default_address, optional_address } = req.body;

//   try {
//     const user = await AuthService.registerWithToken({
//       idToken,
//       name,
//       email,
//       default_address,
//       optional_address,
//     });

//     res.status(201).json({ message: "Registro exitoso", user });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

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
