// web/controllers/BookController.mjs

class BookController {
    constructor() {
        // La URL de tu API sin el prefijo /api, según tu configuración en app.mjs
        this.apiUrl = "http://localhost:3000/books"; 
    }

    async cargarLibrosEnPantalla() {
        const contenedor = document.getElementById("contenedor-libros");
        
        try {
            // 1. Llamamos a la API (usa el método getAllBooks que definimos)
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.status}`);
            }

            const libros = await response.json();

            // 2. Limpiamos el contenedor (quitamos el mensaje de "Conectando...")
            contenedor.innerHTML = "";

            if (libros.length === 0) {
                contenedor.innerHTML = "<p>No hay libros disponibles en el catálogo.</p>";
                return;
            }

            // 3. Generamos las tarjetas usando las clases del main.css
            libros.forEach(libro => {
                const div = document.createElement("div");
                div.className = "libro-card"; 
                
                // Estructura optimizada para el CSS de cuadrícula
                div.innerHTML = `
                    <img src="${libro.portada || 'https://via.placeholder.com/150'}" alt="${libro.titulo}">
                    <div class="libro-card-info">
                        <div>
                            <h3>${libro.titulo}</h3>
                            <p><strong>Autor:</strong> ${libro.autor}</p>
                        </div>
                        <div>
                            <p class="precio">${libro.precio} €</p>
                            <button class="btn-detalles" onclick="verDetalle(${libro.id})">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                `;
                contenedor.appendChild(div);
            });
        } catch (error) {
            console.error("Error al conectar con la API:", error);
            contenedor.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: red;">
                    <p>No se han podido cargar los libros.</p>
                    <small>Asegúrate de que la API esté corriendo en el puerto 3000 y Supabase esté conectado.</small>
                </div>`;
        }
    }
}

// Función global para manejar el clic en "Ver Detalles"
window.verDetalle = (id) => {
    // Redirige a la página de detalle pasando el ID por la URL
    window.location.href = `libro_detalle.html?id=${id}`;
};

// Inicializamos y ejecutamos
const bookCtrl = new BookController();
bookCtrl.cargarLibrosEnPantalla();

export default bookCtrl;