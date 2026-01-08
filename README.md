# proyecto_libreria

Repositorio que alberga un proyecto de libreria online

POR FAVOR USAR EL REPOSITORIO DE LA RAMA API. ES EL QUE TIENE TODAS LAS FUNCIONALIDADES.

En la carpeta web/public/js se incluye un archivo en forma de plantilla para firebase en el cliente.
Este archivo es necesario para la correcta autenticacion de usuarios y gestion del carrito de compras.

Dependecias necesarias para ejecutar el proyecto:

- Node.js
- PostgreSQL
- Supabase
- Express
- Axios
- EJS
- Multer
- Dotenv
- CookieParser
- Firebase
- Session Express

📚 Sistema de Gestión de Librería (Fullstack)
Este proyecto es una plataforma integral para la gestión de libros, usuarios y pedidos. Utiliza una arquitectura desacoplada con una API REST en el backend y un cliente Web (EJS) en el frontend.

⚠️ Requisito Obligatorio de Rama
Para que el proyecto funcione correctamente con todas las últimas correcciones de base de datos, optimización de conexiones y endpoints:

Asegúrate de estar en la rama api.

No utilices la rama main para desarrollo activo.

Bash

git checkout api
🛠️ Instalación y Preparación

1. Clonar el repositorio
   Bash

git clone <url-del-repositorio>
cd proyecto_libreria 2. Instalar Dependencias
El proyecto utiliza dependencias tanto en la carpeta de la API como en la Web. Ejecuta desde la raíz:

Bash

npm install
Dependencias clave: express, pg (PostgreSQL), axios, ejs, multer, dotenv.

3. Configuración de Variables de Envío (.env)
   Crea un archivo .env dentro de la carpeta api/ con los siguientes datos de tu proyecto de Supabase:

Fragmento de código

# Configuración de Base de Datos (Supabase)

DB_USER=postgres
DB_PASSWORD=tu_password_de_supabase
DB_HOST=aws-0-tu-region.pooler.supabase.com # <--- USA EL HOST DEL POOLER
DB_NAME=postgres
DB_PORT=6543 # <--- PUERTO DEL POOLER (Modo Transacción)

# Configuración del Servidor

PORT=3000
🗄️ Estructura de la Base de Datos (SQL)
Para el correcto funcionamiento, la base de datos en Supabase debe tener las siguientes tablas y restricciones:

Restricción de Formatos (Case Sensitive)
La tabla books requiere una restricción CHECK específica. Los valores deben coincidir exactamente con los enviados desde el frontend:

SQL

ALTER TABLE books ADD CONSTRAINT books_format_check
CHECK (format = ANY (ARRAY['Hardcover'::text, 'Paperback'::text, 'eBook'::text, 'AudioBook'::text]));
Tabla de Pedidos e Ítems
El sistema gestiona una relación de uno a muchos entre orders y order_items.

Orders: Almacena user_id, total y status (PENDIENTE, PAGADO, etc.).

Order_Items: Almacena el price_at_time para congelar el precio en el momento de la compra.

🚀 Ejecución del Sistema
Para que la aplicación funcione, se deben iniciar ambos servidores:

Backend (API):

Bash

cd api
node index.mjs
Frontend (Web):

Bash

cd web
node app.mjs
💡 Notas de Implementación Críticas

1. Gestión de Conexiones (Supabase PgBouncer)
   Se ha optimizado el código para evitar el error Max client connections reached:

Eliminación de fugas: Se sustituyó pool.connect() por pool.query() en consultas de lectura.

Liberación automática: En funciones transaccionales, se garantiza el uso de client.release() en bloques finally.

Puerto 6543: Es obligatorio usar este puerto en Supabase para permitir el balanceo de conexiones en modo transacción.

2. Optimización del Panel de Pedidos
   El controlador de administración carga los detalles de los libros mediante Promise.all. Esto evita el "Infierno de Awaits" y reduce drásticamente el número de conexiones simultáneas abiertas a la base de datos.

3. Validaciones de Frontend
   El formulario de creación de libros en add_book.ejs envía los valores de formato exactamente como los espera la base de datos (eBook, AudioBook), evitando errores de violación de restricción CHECK.

📁 Estructura del Proyecto
/api: Repositorios (Lógica SQL), Controladores de API y Modelos.

/web: Vistas EJS, Controladores de interfaz y comunicación via Axios.

/uploads: Carpeta de destino para las imágenes de portada procesadas por Multer.
