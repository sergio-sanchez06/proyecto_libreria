// app.js

const express = require('express'); 
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv'); // Importar dotenv
const session = require('express-session');

// Cargar variables de entorno inmediatamente
dotenv.config();

// 1. DEFINICIÓN DEL SERVIDOR Y PUERTO
const PORT = process.env.PORT || 3000; // Usar const para el puerto
const app = express(); // Usar const para la aplicación

// ----------------------------------------------------
// 2. CONFIGURACIÓN DE LA CONEXIÓN A LA BASE DE DATOS
// ----------------------------------------------------

const pool = new Pool({
    user: process.env.DB_USER, 
    host: process.env.DB_HOST, 
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false } 
    // Siempre false si no usas un certificado real para desarrollo local
});

pool.connect()
    .then(client => {
        console.log('✅ Conexión exitosa a la base de datos');
        client.release();
    })
    .catch(err => console.error('❌ Error de conexión con la base de datos: ', err.stack));

// Exponer el pool a toda la aplicación para que los controllers lo usen
app.locals.db = pool;


// ----------------------------------------------------
// 3. MIDDLEWARES (Configuración de Express)
// ----------------------------------------------------

// Procesar datos de formularios (POST) y JSON
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// Configuración de Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'CLAVE_SECRETA_SUPER_LARGA_Y_COMPLEJA', // CRÍTICO: Usar variable de entorno
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false } // Cambiar a 'secure: true' solo si usas HTTPS en producción
}));

// Configuración de EJS
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'servidor', 'views')); 

// Configuración de archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'servidor', 'public')));


// ----------------------------------------------------
// 4. MONTAR LAS NUEVAS RUTAS MODULARES
// ----------------------------------------------------

// Importar las rutas WEB (GETs, Vistas, Lectura)
const webRoutes = require('./routes/webRoutes'); 
// Importar las rutas API (POSTs, Acciones, Lógica de Negocio)
const apiRoutes = require('../api/routes/apiRoutes'); 

// Montar las rutas en la aplicación
// Se montan ambas en la raíz ('/')
app.use('/', webRoutes); 
app.use('/', apiRoutes); 

// (Opcional) Nota: Ya no se usa 'libroController', sus funciones están en web/api.

// ----------------------------------------------------
// 5. INICIAR LA ESCUCHA DEL SERVIDOR
// ----------------------------------------------------


// Comprobar cambio de rama

app.listen(PORT, () => {
    console.log(`Servidor Express listo en http://localhost:${PORT}`);
});