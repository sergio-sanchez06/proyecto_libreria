// controllers/UserController.mjs
import UserRepository from "../Repositories/UserRepository.mjs";

async function getMe(req, res) {
  // req.user viene del middleware de autenticación
  res.status(200).json({
    message: "Perfil del usuario",
    user: req.user,
  });
}

async function updateProfile(req, res) {
  try {
    // req.user.id viene del middleware
    const updates = {
      id: req.user.id,
      ...req.body,
    };

    console.log("Updates enviados:", updates); // Log para depurar

    const updatedUser = await UserRepository.updateProfile(updates);

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

async function getAllUsers(req, res) {
  try {
    const users = await UserRepository.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
}

async function getUserById(req, res) {
  try {
    const user = await UserRepository.getUserById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
}

async function updateUser(req, res) {
  try {
    const updateData = { id: req.params.id, ...req.body };
    console.log("Update data:", updateData);
    const user = await UserRepository.updateUser(updateData);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Error al actualizar" });
  }
}

async function deleteUser(req, res) {
  try {
    const { firebase_uid } = await UserRepository.deleteUser(req.params.id);

    // Eliminar de Firebase (opcional)
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
  getMe,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
