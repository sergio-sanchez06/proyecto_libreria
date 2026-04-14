// tokenRefresh.mjs
// Incluir en todas las páginas que requieran acciones críticas
import { auth } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutos (antes de que expire la hora)

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  // Renovación periódica automática
  setInterval(async () => {
    try {
      const freshToken = await user.getIdToken(true);

      // Actualizamos el idToken en sesión del servidor
      await fetch("/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: freshToken }),
      });

      console.log("Token renovado correctamente");
    } catch (err) {
      console.error("Error renovando token:", err);
    }
  }, REFRESH_INTERVAL);
});
