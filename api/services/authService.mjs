import admin from "../config/firebase.mjs";
import UserRepository from "../Repositories/UserRepository.mjs";

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

export default {
  registerWithToken,
  verifyTokenAndGetUser,
};
