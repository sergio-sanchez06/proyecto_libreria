// web/public/js/auth.js

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Importamos la instancia de auth desde tu archivo centralizado
// Si renombraste el archivo a .js, asegúrate de cambiar la extensión aquí también
import { auth } from "./firebaseConfig.mjs";

const API_URL = "http://localhost:3000/auth";

/**
 * Iniciar sesión con Firebase y enviar el token al backend
 */
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
    console.error("Error en login:", error);
    throw new Error(error.message || "Error al iniciar sesión");
  }
}

/**
 * Registrar nuevo usuario en Firebase y en la base de datos local
 */
export async function register({
  email,
  password,
  name,
  default_address,
  optional_address,
}) {
  try {
    // 1. Crear usuario en Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 2. Actualizar el nombre en el perfil de Firebase (V9 Modular)
    await updateProfile(userCredential.user, { displayName: name });

    const idToken = await userCredential.user.getIdToken();

    // 3. Registrar datos adicionales en nuestro servidor
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
    console.error("Error en registro:", error);
    throw new Error(error.message || "Error al registrar");
  }
}

/**
 * Cerrar sesión en Firebase y limpiar almacenamiento local
 */
export async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

/**
 * Verificar si existe un token en el almacenamiento local
 */
export function isLoggedIn() {
  return !!localStorage.getItem("idToken");
}

/**
 * Obtener los datos del usuario guardados en local
 */
export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Inicializar la lógica de checkout verificando el estado de Firebase
 */
export function initCheckout() {
  console.log("🛒 Inicializando checkout...");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("❌ No hay usuario autenticado");
      alert("Debes iniciar sesión para finalizar la compra");
      window.location.href = "/login";
      return;
    }

    try {
      const token = await user.getIdToken();
      const tokenInput = document.getElementById("firebase-token");
      const checkoutBtn = document.getElementById("checkout-btn");

      if (tokenInput && checkoutBtn) {
        tokenInput.value = token;
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Finalizar compra";
        console.log("✅ Checkout preparado para el usuario:", user.email);
      }
    } catch (err) {
      console.error("❌ Error obteniendo token en checkout:", err);
      alert("Error de autenticación. Intenta iniciar sesión de nuevo.");
    }
  });
}
