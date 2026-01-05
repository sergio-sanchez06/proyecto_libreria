import admin from "../config/firebase.mjs";
import UserRepository from "../Repositories/UserRepository.mjs";

async function createUser(userData) {
  const { email, password, name } = userData;

  try {
    // 1. Crear en Firebase usando Admin SDK
    return await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
  } catch (error) {
    // 4. Ahora sí podemos preguntar si firebaseUser existe
    if (firebaseUser && firebaseUser.uid) {
      console.error(
        `Error en BBDD local. Eliminando rastro de Firebase para UID: ${firebaseUser.uid}`
      );
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
      } catch (deleteError) {
        console.error(
          "Error crítico: No se pudo limpiar el usuario de Firebase",
          deleteError
        );
      }
    }
    // Lanzamos el mensaje original del error para saber qué falló en SQL
    throw new Error("Error en AuthService (Admin): " + error.message);
  }
}
// async function adminCreateUser(userData) {
//   const { email, password, name, role, default_address, optional_address } =
//     userData;

//   // 1. Declaramos la variable fuera para que sea accesible en el catch
//   let firebaseUser = null;

//   try {
//     // 2. Crear en Firebase usando Admin SDK
//     firebaseUser = await admin.auth().createUser({
//       email,
//       password,
//       displayName: name,
//     });

//     // 3. Llamar al repositorio para guardar en SQL
//     const newUser = await UserRepository.upsertFromFirebase({
//       firebase_uid: firebaseUser.uid,
//       email,
//       name,
//       role: role || "CLIENT",
//       default_address,
//       optional_address,
//     });

//     return newUser;
//   } catch (error) {
//     // 4. Ahora sí podemos preguntar si firebaseUser existe
//     if (firebaseUser && firebaseUser.uid) {
//       console.error(
//         `Error en BBDD local. Eliminando rastro de Firebase para UID: ${firebaseUser.uid}`
//       );
//       try {
//         await admin.auth().deleteUser(firebaseUser.uid);
//       } catch (deleteError) {
//         console.error(
//           "Error crítico: No se pudo limpiar el usuario de Firebase",
//           deleteError
//         );
//       }
//     }
//     // Lanzamos el mensaje original del error para saber qué falló en SQL
//     throw new Error("Error en AuthService (Admin): " + error.message);
//   }
// }

// async function registerUser(userData) {
//   const { email, password, name, default_address, optional_address } = userData;
//   let firebaseUser = null;

//   try {
//     // 1. Crear en Firebase
//     firebaseUser = await admin.auth().createUser({
//       email,
//       password,
//       displayName: name,
//     });

//     // 2. Guardar en BBDD local (Forzamos rol 'user' y addresses)
//     const newUser = await UserRepository.upsertFromFirebase({
//       firebase_uid: firebaseUser.uid,
//       email,
//       name,
//       role: "CLIENT", // Siempre user por seguridad
//       default_address: default_address || null,
//       optional_address: optional_address || null,
//     });

//     return newUser;
//   } catch (error) {
//     // Rollback: Si se creó en Firebase pero falló la DB local
//     if (firebaseUser && firebaseUser.uid) {
//       await admin.auth().deleteUser(firebaseUser.uid);
//     }
//     throw new Error("Error en el registro: " + error.message);
//   }
// }

async function registerWithToken(data) {
  const { idToken, name, email, default_address, optional_address } = data;

  try {
    // 1. En lugar de crear al usuario, VERIFICAMOS el token que creó el cliente
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebase_uid = decodedToken.uid;

    // 2. Ahora que tenemos el UID real de Firebase, guardamos en nuestras 3 tablas
    return await UserRepository.upsertFromFirebase({
      firebase_uid: firebase_uid,
      name: name,
      email: email,
      role: "CLIENT", // Rol por defecto
      default_address: default_address,
      optional_address: optional_address,
    });
  } catch (error) {
    console.error("Error verificando token en registro:", error);

    if (firebaseUid) {
      console.error(
        `Error en BBDD local. Eliminando rastro de Firebase para UID: ${firebaseUid}`
      );
      try {
        await admin.auth().deleteUser(firebaseUid);
      } catch (deleteError) {
        console.error(
          "Error crítico: No se pudo limpiar el usuario de Firebase",
          deleteError
        );
      }
    }
    throw new Error("Token de registro inválido");
  }
}

async function verifyTokenAndGetUser(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Token requerido y debe ser string");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log("Token verificado correctamente para:", decodedToken.email);

    const firebase_uid = decodedToken.uid;
    const user = await UserRepository.getUserByFirebaseUid(firebase_uid);

    if (!user) {
      throw new Error("Usuario no encontrado. Regístrate primero.");
    }

    return user;
  } catch (error) {
    console.error("Error verificando ID token:", error.code, error.message);

    if (error.code === "auth/id-token-expired") {
      throw new Error("Token expirado");
    } else if (error.code === "auth/argument-error") {
      throw new Error("Token mal formado");
    } else if (error.code === "auth/invalid-id-token") {
      throw new Error("Token inválido");
    } else {
      throw new Error("Error en autenticación");
    }
  }
}

async function deleteAuthUser(firebase_uid) {
  try {
    return await admin.auth().deleteUser(firebase_uid);
  } catch (error) {
    console.error("Error al eliminar usuario de Firebase:", error);
    throw error;
  }
}

export default {
  //registerWithToken,
  verifyTokenAndGetUser,
  createUser,
  deleteAuthUser,
};
