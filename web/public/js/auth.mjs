// web/public/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvh7UG5-wdn7JR408JDgKcvcNpkmH4Kf8",
  authDomain: "libreria-ed6c0.firebaseapp.com",
  projectId: "libreria-ed6c0",
  storageBucket: "libreria-ed6c0.firebasestorage.app",
  messagingSenderId: "140935488654",
  appId: "1:140935488654:web:4dd044759584b563d415df",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "http://localhost:3000/auth";

// Login
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Error en login");

    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    throw new Error(error.message || "Error al iniciar sesión");
  }
}

// Registro
export async function register({
  email,
  password,
  name,
  default_address,
  optional_address,
}) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await userCredential.user.updateProfile({ displayName: name });

    const idToken = await userCredential.user.getIdToken();

    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        default_address,
        optional_address,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Error en registro");

    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    throw new Error(error.message || "Error al registrar");
  }
}

// Logout
export async function logout() {
  await signOut(auth);
  localStorage.removeItem("idToken");
  localStorage.removeItem("user");
}

// Comprobar si está logueado
export function isLoggedIn() {
  return !!localStorage.getItem("idToken");
}

// Obtener usuario actual
export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
