// web/js/authController.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAvh7UG5-wdn7JR408JDgKcvcNpkmH4Kf8",
    authDomain: "libreria-ed6c0.firebaseapp.com",
    projectId: "libreria-ed6c0",
    storageBucket: "libreria-ed6c0.firebasestorage.app",
    messagingSenderId: "140935488654",
    appId: "1:140935488654:web:4dd044759584b563d415df"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class AuthController {
    constructor() {
        this.apiUrl = "http://localhost:3000/auth";
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch(`${this.apiUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error en login");
            }

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("idToken", idToken);

            return { success: true, user: data.user };
        } catch (error) {
            throw new Error(error.message || "Error al iniciar sesión");
        }
    }

    async register({ email, password, name, default_address, optional_address }) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await userCredential.user.updateProfile({ displayName: name });

            const idToken = await userCredential.user.getIdToken();

            const response = await fetch(`${this.apiUrl}/register`, {
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

            if (!response.ok) {
                throw new Error(data.message || "Error en registro");
            }

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("idToken", idToken);

            return { success: true, user: data.user };
        } catch (error) {
            throw new Error(error.message || "Error al registrar");
        }
    }

    async logout() {
        await signOut(auth);
        localStorage.removeItem("user");
        localStorage.removeItem("idToken");
    }

    getCurrentUser() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn() {
        return !!this.getCurrentUser();
    }
}

export default new AuthController();