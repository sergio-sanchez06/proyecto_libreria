// web/public/js/auth.mjs

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  TwitterAuthProvider,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm";
import { auth } from "./firebaseConfig.mjs";

const API_URL = "http://localhost:3000/auth";

// Configuración centralizada de Axios
const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial para permitir que el servidor gestione cookies de sesión
});

// Cambio de Contraseña con email y contraseña

export async function changePassword(email, password, newPassword) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
  await updatePassword(userCredential.user,newPassword)
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Iniciar sesión con Email y Password
 */
export async function getFirebaseToken(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return await userCredential.user.getIdToken();
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Autentica con Google y devuelve el ID Token
 */
export async function getGoogleToken() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTwitterToken() {
  const provider = new TwitterAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
}

/**
 * Registrar nuevo usuario
 */
export async function register(userData) {
  const { email, password, name, default_address, optional_address } = userData;
  try {
    // 1. Registro en Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(userCredential.user, { displayName: name });
    const idToken = await userCredential.user.getIdToken();

    // 2. Registro en base de datos local
    const response = await apiClient.post(`${API_URL}/register`, {
      email,
      password,
      name,
      default_address,
      optional_address,
    });

    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data.user;
  } catch (error) {
    console.error("Error en registro:", error);
    const errorMsg =
      error.response?.data?.message || error.message || "Error al registrar";
    throw new Error(errorMsg);
  }
}

/**
 * Cerrar sesión
 */
export async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
    // Opcional: Llamar al backend para destruir la cookie de sesión si existe
    await apiClient.post(`${API_URL}/logout`).catch(() => {});
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

/**
 * Utilidades de estado
 */
export function isLoggedIn() {
  return !!localStorage.getItem("idToken");
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Lógica para la vista de Checkout
 */

export function initCheckout() {
  onAuthStateChanged(auth, async (user) => {
    const checkoutBtn = document.getElementById("checkout-btn");
    const checkoutSpinner = document.getElementById("checkout-spinner");
    const checkoutText = document.getElementById("checkout-text");
    const checkoutForm = document.getElementById("checkout-form");
    const tokenInput = document.getElementById("firebase-token");

    if (!user) {
      window.location.href = "/login?returnTo=/cart/view";
      return;
    }

    // Ya sabemos que hay usuario, habilitamos el botón visualmente
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      if (checkoutSpinner) checkoutSpinner.classList.add("d-none");
      if (checkoutText) checkoutText.textContent = "Confirmar y Pagar";
    }

    // ESCUCHAMOS EL CLIC FINAL
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Detenemos el envío para refrescar el token

        try {
          // 1. Bloqueamos interfaz
          checkoutBtn.disabled = true;
          checkoutText.textContent = "Validando seguridad...";
          if (checkoutSpinner) checkoutSpinner.classList.remove("d-none");

          // 2. PEDIMOS TOKEN FRESCO (La clave del éxito)
          const freshToken = await user.getIdToken(true);
          tokenInput.value = freshToken;

          // 3. Enviamos el formulario manualmente
          checkoutForm.submit();
        } catch (err) {
          console.error("Error al refrescar token antes de pagar:", err);
          alert("Error de seguridad. Por favor, recarga la página.");
          checkoutBtn.disabled = false;
        }
      });
    }
  });
}

// export function initCheckout() {
//   onAuthStateChanged(auth, async (user) => {
//     if (!user) {
//       window.location.href = "/login";
//       return;
//     }

//     try {
//       const token = await user.getIdToken();
//       const tokenInput = document.getElementById("firebase-token");
//       const checkoutBtn = document.getElementById("checkout-btn");

//       if (tokenInput && checkoutBtn) {
//         tokenInput.value = token;
//         checkoutBtn.disabled = false;
//         checkoutBtn.textContent = "Finalizar compra";
//       }
//     } catch (err) {
//       console.error("Error en checkout auth:", err);
//     }
//   });
// }

export async function getFreshToken() {
  return new Promise((resolve, reject) => {
    // onAuthStateChanged espera a que Firebase sepa si hay alguien logueado
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Dejamos de escuchar una vez obtenemos la respuesta
      if (user) {
        try {
          const token = await user.getIdToken(true);
          resolve(token);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("No hay usuario autenticado en Firebase"));
      }
    });
  });
}
