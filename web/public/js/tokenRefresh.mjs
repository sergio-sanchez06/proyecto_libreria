// tokenRefresh.mjs
// Incluir en todas las páginas que requieran acciones críticas
import { auth } from "./firebaseConfig.mjs";
import { onIdTokenChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

onIdTokenChanged(auth, async (user) => {
  if (!user) return; // No hay sesión Firebase activa, nada que sincronizar

  try {
    // getIdToken(true) fuerza la renovación inmediata si el token está próximo a expirar.
    // onIdTokenChanged ya se dispara cuando Firebase lo renueva internamente,
    // pero llamar con true aquí garantiza que siempre enviamos un token fresco.
    const freshToken = await user.getIdToken(true);

    const response = await fetch("/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: freshToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log("[tokenRefresh] Token sincronizado con el servidor.");
      return;
    }

    // El servidor rechazó el token — puede ser inválido, revocado o sin sesión activa
    if (data.forceLogout) {
      console.warn(
        "[tokenRefresh] Servidor solicitó logout. Cerrando sesión Firebase.",
        data.message
      );
      await signOut(auth).catch(() => {});
      window.location.href = "/login?error=" + encodeURIComponent("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      return;
    }

    // Error transitorio (503, 500) — Firebase reintentará en el próximo ciclo
    console.warn("[tokenRefresh] Error temporal en el servidor:", response.status, data.message);
  } catch (err) {
    // Error de red — no forzamos logout, Firebase reintentará cuando haya conectividad
    console.error("[tokenRefresh] Error de red al sincronizar token:", err);
  }
});

// const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutos (antes de que expire la hora)

// onAuthStateChanged(auth, (user) => {
//   if (!user) return;

//   // Renovación periódica automática
//   setInterval(async () => {
//     try {
//       const freshToken = await user.getIdToken(true);

//       // Actualizamos el idToken en sesión del servidor
//       await fetch("/auth/refresh-token", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ idToken: freshToken }),
//       });

//       console.log("Token renovado correctamente");
//     } catch (err) {
//       console.error("Error renovando token:", err);
//     }
//   }, REFRESH_INTERVAL);
// });
