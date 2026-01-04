// Función para añadir productos
export function agregarAlCarrito(id, titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: id,
            titulo: titulo,
            precio: parseFloat(precio),
            imagen: imagen || '/images/default-cover.jpg', // Evitamos el error de 'imagen is not defined'
            cantidad: 1
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert(`${titulo} ha sido añadido al carrito`);
    
    // Si estamos en la página del carrito, refrescamos la tabla
    if (document.getElementById('cart-table-body')) {
        renderizarCarrito();
    }
}

// Función para dibujar los productos en la tabla
export function renderizarCarrito() {
    const tabla = document.getElementById('cart-table-body');
    const totalElemento = document.getElementById('cart-total');
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let total = 0;

    if (!tabla) return; // Si no estamos en la página del carrito, no hacemos nada

    tabla.innerHTML = '';

    if (carrito.length === 0) {
        tabla.innerHTML = '<tr><td colspan="5" class="text-center">El carrito está vacío</td></tr>';
    } else {
        carrito.forEach((item, index) => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            tabla.innerHTML += `
                <tr>
                    <td><img src="${item.imagen}" width="50"></td>
                    <td>${item.titulo}</td>
                    <td>${item.precio.toFixed(2)}€</td>
                    <td>${item.cantidad}</td>
                    <td>${subtotal.toFixed(2)}€</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    if (totalElemento) totalElemento.innerText = `${total.toFixed(2)}€`;
}

// Hacer las funciones accesibles desde el HTML (necesario para el onclick)
window.eliminarDelCarrito = function(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
};

document.getElementById('btn-finalizar')?.addEventListener('click', async () => {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    // Aquí comprobamos si hay usuario logueado
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert("Debes iniciar sesión para finalizar la compra");
        window.location.href = "/login";
        return;
    }

    // Enviar al servidor para crear el pedido
    console.log("Enviando pedido al servidor...", { usuario: user.id, productos: carrito });
    alert("¡Pedido procesado con éxito! (Simulado)");
    // localStorage.removeItem('carrito');
    // window.location.href = "/historial";
});

// Cargar la tabla al iniciar
document.addEventListener('DOMContentLoaded', renderizarCarrito);