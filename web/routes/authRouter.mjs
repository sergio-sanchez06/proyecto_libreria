// web/js/router.js
import AuthController from "../controllers/authController.mjs";

class Router {
    constructor() {
        this.routes = {
            "/login": "login.html",
            "/register": "register.html",
            "/": "index.html",
            "/dashboard": "index.html",
        };

        window.addEventListener("popstate", () => this.navigate());
        document.addEventListener("click", (e) => {
            if (e.target.matches("[data-link]")) {
                e.preventDefault();
                this.navigateTo(e.target.href);
            }
        });
    }

    navigate() {
        const path = window.location.pathname;
        const page = this.routes[path] || "index.html";

        if (path === "/login" || path === "/register") {
            this.loadPage(page);
        } else {
            // Rutas protegidas
            if (AuthController.isLoggedIn()) {
                this.loadPage(page);
            } else {
                this.navigateTo("/login");
            }
        }
    }

    navigateTo(url) {
        history.pushState(null, null, url);
        this.navigate();
    }

    async loadPage(page) {
        const response = await fetch(page);
        const html = await response.text();
        document.getElementById("app").innerHTML = html;

        // Ejecutar script de la página si existe
        const script = document.querySelector("#page-script");
        if (script) {
            eval(script.innerHTML);
        }
    }
}

export default new Router();