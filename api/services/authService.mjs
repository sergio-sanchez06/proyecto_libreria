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
  const decoded = await admin.auth().verifyIdToken(idToken);
  return await UserRepository.upsertFromFirebase({
    firebase_uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.displayName || "Usuario",
  });
}

export default {
  registerWithEmailPassword,
  verifyTokenAndGetUser,
};
