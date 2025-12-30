import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvh7UG5-wdn7JR408JDgKcvcNpkmH4Kf8",
  authDomain: "libreria-ed6c0.firebaseapp.com",
  projectId: "libreria-ed6c0",
  storageBucket: "libreria-ed6c0.firebasestorage.app",
  messagingSenderId: "140935488654",
  appId: "1:140935488654:web:4dd044759584b563d415df",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar auth para usarlo en otros archivos
export const auth = getAuth(app);
