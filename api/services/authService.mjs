import admin from "../config/firebase.mjs";
import UserRepository from "../Repositories/UserRepository.mjs";

async function registerWithEmailPassword(user) {
  const userRecord = await admin.auth().createUser({
    email: user.email,
    password: user.password,
    displayName: user.name,
  });
  return await UserRepository.upsertFromFirebase({
    firebase_uid: userRecord.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    default_address: user.default_address,
    optional_address: user.optional_address,
  });
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
  registerWithEmailPassword,
  verifyTokenAndGetUser,
};
