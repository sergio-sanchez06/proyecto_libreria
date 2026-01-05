// controllers/UserController.mjs
import UserRepository from "../Repositories/UserRepository.mjs";
import authService from "../services/authService.mjs";

async function adminCreateUser(req, res) {
  const { email, password, name, role, default_address, optional_address } =
    req.body;

  const userData = { email, password, name };

  let firebaseUser = null;

  try {
    // Llamamos al servicio, que es el que sabe qué hacer
    firebaseUser = await authService.createUser(userData);

    const newUser = await UserRepository.upsertFromFirebase({
      firebase_uid: firebaseUser.uid,
      email,
      name,
      role: role || "CLIENT",
      default_address,
      optional_address,
    });

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(400).json({
      message: "No se pudo crear el usuario",
      error: error.message,
    });
  }
}

async function registerUser(req, res) {
  const { email, password, name, role, default_address, optional_address } =
    req.body;

  const userData = { email, password, name };

  let firebaseUser = null;

  try {
    // Llamamos al servicio, que es el que sabe qué hacer
    firebaseUser = await authService.createUser(userData);

    const newUser = await UserRepository.upsertFromFirebase({
      firebase_uid: firebaseUser.uid,
      email,
      name,
      role: "CLIENT",
      default_address,
      optional_address,
    });

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(400).json({
      message: "No se pudo crear el usuario",
      error: error.message,
    });
  }
}
// async function createUser(req, res) {
//   try {
//     // Llamamos al servicio, que es el que sabe qué hacer
//     const newUser = await authService.adminCreateUser(req.body);

//     res.status(201).json({
//       message: "Usuario creado con éxito",
//       user: newUser,
//     });
//   } catch (error) {
//     console.error("Error al crear usuario:", error);
//     res.status(400).json({
//       message: "No se pudo crear el usuario",
//       error: error.message,
//     });
//   }
// }

async function getMe(req, res) {
  // req.user viene del middleware de autenticación
  // res.status(200).json({
  //   message: "Perfil del usuario",
  //   user: req.user,
  // });

  try {
    console.log("Recuperando perfil del usuario");

    const user = await UserRepository.getUserById(req.params.id);
    res.status(200).json({
      message: "Perfil del usuario",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
}

async function updateProfile(req, res) {
  try {
    // req.user.id viene del middleware
    const updates = {
      id: req.user.id,
      name: req.body.name,
      default_address: req.body.default_address,
      optional_address: req.body.optional_address,
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
    const user = await UserRepository.updateProfile(updateData);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Error al actualizar" });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id; // El ID que pasaste en el hidden input

    // 1. Obtener UID de Firebase antes de borrar de SQL
    // const user = await UserRepository.getUserById(userId);

    // 2. Borrar de SQL

    const { firebase_uid } = await UserRepository.deleteUser(userId);

    // 3. Borrar de Firebase (Lógica delegada al servicio)
    if (firebase_uid) {
      await authService.deleteAuthUser(firebase_uid);
    }

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
}

export default {
  getMe,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminCreateUser,
  registerUser,
};
