// controllers/UserController.mjs
import UserRepository from "../Repositories/UserRepository.mjs";
import authService from "../services/authService.mjs";
import emailService from "../services/emailService.mjs";

async function adminCreateUser(req, res) {
  const { email, password, name, role, default_address, optional_address } =
    req.body;

  const userData = { email, password, name };

  let firebaseUser = null;

  try {
    // Llamamos al servicio, que es el que sabe qué hacer
    firebaseUser = await authService.createUser(userData);

    const { user: newUser } = await UserRepository.upsertFromFirebase({
      firebase_uid: firebaseUser.uid,
      email,
      name,
      role: role || "CLIENT",
      default_address,
      optional_address,
    });

    try {
      await emailService.sendWelcomeEmail(newUser.email, newUser.name);
    } catch (mailError) {
      console.error("Error enviando email (admin):", mailError.message);
    }

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
    });
  } catch (error) {
    console.error("Error crítico en el registro:", error.message);

    // 3. Rollback Manual: Si Firebase se creó pero SQL falló
    if (firebaseUser) {
      try {
        console.log(
          `Iniciando rollback: eliminando UID ${firebaseUser.uid} de Firebase...`,
        );
        await authService.deleteAuthUser(firebaseUser.uid);
      } catch (rollbackError) {
        console.error(
          "CRÍTICO: No se pudo realizar el rollback en Firebase:",
          rollbackError.message,
        );
        // Aquí podrías enviar una alerta a un sistema de monitoreo
      }
    }

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

    const { user: newUser, isNewUser } = await UserRepository.upsertFromFirebase({
      firebase_uid: firebaseUser.uid,
      email,
      name,
      role: "CLIENT",
      default_address,
      optional_address,
    });

    // 3. Enviar correo de notificación (Opcional: No crítico)
    try {
      await emailService.sendWelcomeEmail(newUser.email, newUser.name);
    } catch (mailError) {
      console.error("Error enviando email de bienvenida:", mailError.message);
      // No lanzamos el error para que el cliente reciba el 201 OK de la reactivación
    }

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
      isNewUser: isNewUser,
    });
  } catch (error) {
    console.error("Error crítico en el registro:", error.message);

    // 3. Rollback Manual: Si Firebase se creó pero SQL falló
    if (firebaseUser) {
      try {
        console.log(
          `Iniciando rollback: eliminando UID ${firebaseUser.uid} de Firebase...`,
        );
        await authService.deleteAuthUser(firebaseUser.uid);
      } catch (rollbackError) {
        console.error(
          "CRÍTICO: No se pudo realizar el rollback en Firebase:",
          rollbackError.message,
        );
        // Aquí podrías enviar una alerta a un sistema de monitoreo
      }
    }

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
  console.log("Ide usuario", req.user.id);
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

    const { mode } = req.body;

    const user = await UserRepository.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. REGLA DE SEGURIDAD: NO BORRAR ADMINISTRADORES
    // Esto evita que un admin degrade a otro y lo borre, o se borre a sí mismo.
    if (user.role === "ADMIN") {
      return res.status(403).json({
        message:
          "Prohibido: No se pueden eliminar o deshabilitar cuentas administrativas.",
      });
    }

    console.log(`API: Eliminando usuario ${user.email} en modo: ${mode}`);

    let firebaseUid;

    // 1. Obtener UID de Firebase antes de borrar de SQL
    // const user = await UserRepository.getUserById(userId);

    if (mode === "hard") {
      // 1. Eliminar/Anonimizar en base de datos (SQL)
      firebaseUid = await UserRepository.deleteUserAndAnonimaze(userId);
      console.log("Resultado de borrar usuario:", firebaseUid);
      // 2. Borrado físico en Firebase (Ya no podrá hacer login)
      if (firebaseUid) {
        await authService.deleteAuthUser(firebaseUid);
      }

      // 3. Enviar correo de notificación
      try {
        await emailService.sendDeletedAccountEmail(user.email, user.name);
      } catch (mailError) {
        console.error(
          "Error enviando email de eliminación:",
          mailError.message,
        );
        // No lanzamos el error para que el cliente reciba el 200 OK de la eliminación
      }
    } else {
      // 1. Desactivar en base de datos (is_active = false)
      firebaseUid = await UserRepository.disableUser(userId);

      // 2. Inhabilitar en Firebase (IMPORTANTE)
      // No lo borramos, pero le impedimos loguearse hasta que lo reactivemos
      if (firebaseUid) {
        await authService.updateUserStatus(firebaseUid, false);
      }

      // 3. Enviar correo de notificación
      try {
        await emailService.sendDisableAccountEmail(user.email, user.name);
      } catch (mailError) {
        console.error(
          "Error enviando email de desactivación:",
          mailError.message,
        );
        // No lanzamos el error para que el cliente reciba el 200 OK de la desactivación
      }
    }

    // 2. Borrar de SQL

    // const { firebase_uid } = await UserRepository.deleteUser(userId, mode);

    // // 3. Borrar de Firebase (Lógica delegada al servicio)
    // if (firebase_uid) {
    //   await authService.deleteAuthUser(firebase_uid);
    // }

    res.status(200).json({
      message:
        mode === "hard"
          ? "Cuenta eliminada permanentemente"
          : "Cuenta desactivada correctamente",
    });
  } catch (error) {
    console.error("Error en deleteUser API:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
}

async function reactivateUser(req, res) {
  try {
    const userId = req.params.id;
    // El firebase_uid suele venir en el body o se busca en la DB

    // 1. Buscamos al usuario en la DB para obtener su UID y Email reales
    // Evitamos confiar ciegamente en lo que venga por el body del request
    const user = await UserRepository.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Verificación de seguridad: ¿Es una cuenta anonimizada?
    // Si el email empieza por 'deleted_', es un Hard Delete y NO se puede reactivar.
    if (user.email.startsWith("deleted_")) {
      return res.status(400).json({
        message:
          "No se puede reactivar una cuenta eliminada permanentemente (anonimizada).",
      });
    }

    console.log(`API: Reactivando usuario ${userId}...`);

    // 1. Lógica de Base de Datos (SQL)
    // Eliminamos la marca de deleted_at para que el 'upsert' vuelva a dejarle pasar
    await UserRepository.restoreUser(user.id);

    // 2. Lógica de Firebase
    // Cambiamos el estado de 'disabled: true' a 'disabled: false'
    await authService.updateUserStatus(user.firebase_uid, true);

    // 3. Enviar correo de notificación (Opcional: No crítico)
    try {
      await emailService.sendReactivationEmail(user.email, user.name);
    } catch (mailError) {
      console.error("Error enviando email de reactivación:", mailError.message);
      // No lanzamos el error para que el cliente reciba el 200 OK de la reactivación
    }

    res.status(200).json({
      message:
        "Usuario reactivado con éxito. Ya puede volver a iniciar sesión.",
    });
  } catch (error) {
    console.error("Error al reactivar usuario:", error.message);
    res.status(500).json({
      message: "No se pudo reactivar la cuenta",
      error: error.message,
    });
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
  reactivateUser,
};
