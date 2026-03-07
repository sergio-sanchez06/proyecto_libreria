import { auth } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión para finalizar la compra");
    window.location.href = "/login";
    return;
  }

  console.log("Usuario autenticado:", user);

  try {
    const token = await user.getIdToken();
    document.getElementById("firebase-token").value = token;

    const btn = document.getElementById("checkout-btn");
    btn.disabled = false;
    btn.textContent = "Finalizar compra";

    console.log("Token añadido y botón habilitado");
  } catch (err) {
    console.error("Error obteniendo token:", err);
    alert("Error de autenticación. Intenta iniciar sesión de nuevo.");
  }
});
