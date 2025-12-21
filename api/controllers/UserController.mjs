import UserRepository from "../Repositories/UserRepository.mjs";
import AuthService from "../services/authService.mjs";
// import admin from "../config/firebase.mjs";

export async function getAll(req, res) {
  try {
    const users = await UserRepository.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
}

// Ruta protegida: perfil del usuario autenticado
export async function getMe(req, res) {
  // req.user viene en el middleware de autenticación
  res.status(200).json({
    message: "Perfil del usuario",
    user: req.user,
  });
}

// Actualizar perfil del usuario autenticado
export async function updateProfile(req, res) {
  try {
    const updatedUser = await UserRepository.updateUser({
      id: req.user.id,
      ...req.body,
    });

    res.status(200).json({
      message: "Perfil actualizado",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res
      .status(400)
      .json({ message: error.message || "Error al actualizar perfil" });
  }
}

// Registro de nuevo usuario
export async function register(req, res) {
  try {
    const user = await AuthService.registerWithEmailPassword(req.body);
    res.status(201).json({
      message: "Registro exitoso",
      user,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(400).json({
      message: error.message || "Error al registrar el usuario",
    });
  }
}

// Login con token de Firebase
export async function login(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Token requerido" });
    }

    const user = await AuthService.verifyTokenAndGetUser(idToken);
    res.status(200).json({
      message: "Login exitoso",
      user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// Obtener todos los usuarios (solo ADMIN)
export async function getAllUsers(req, res) {
  try {
    const users = await UserRepository.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
}

// Obtener usuario por ID (protegido: propio o ADMIN)
export async function getUserById(req, res) {
  try {
    const user = await UserRepository.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
}

// Actualizar usuario por ID (protegido: propio o ADMIN)
export async function updateUser(req, res) {
  try {
    const updateData = { id: req.params.id, ...req.body };
    const user = await UserRepository.updateUser(updateData);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Error al actualizar" });
  }
}

// Eliminar usuario (protegido: ADMIN o propio)
export async function deleteUser(req, res) {
  try {
    const { firebase_uid } = await UserRepository.deleteUser(req.params.id);

    // Eliminar al usuario también de Firebase Auth
    if (firebase_uid) {
      try {
        await admin.auth().deleteUser(firebase_uid);
      } catch (firebaseError) {
        console.warn("No se pudo eliminar de Firebase:", firebaseError.message);
      }
    }

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: error.message || "Error al eliminar usuario" });
  }
}

export default {
  register,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAll,
};
