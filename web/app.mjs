// ----------------------------------------------------
// 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ----------------------------------------------------
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const session = require('express-session');

// Cargar variables de entorno
dotenv.config();

// ----------------------------------------------------
// 2. DEFINICIÓN DEL SERVIDOR Y PUERTO
// ----------------------------------------------------
const PORT = process.env.PORT || 3001;
const app = express();

// ----------------------------------------------------
// 3. CONFIGURACIÓN DE LA CONEXIÓN A LA BASE DE DATOS
// ----------------------------------------------------
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(client => {
    console.log('Conexión exitosa a la base de datos');
    client.release();
  })
  .catch(err => console.error('Error de conexión con la base de datos: ', err.stack));

// Exponer el pool a toda la aplicación
app.locals.db = pool;

// ----------------------------------------------------
// 4. MIDDLEWARES
// ----------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'CLAVE_SECRETA_SUPER_LARGA_Y_COMPLEJA',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambiar a true si usas HTTPS en producción
}));

// Motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'servidor', 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'servidor', 'public')));

// ----------------------------------------------------
// 5. RUTAS
// ----------------------------------------------------
const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('../api/routes/apiRoutes');
const libroRoutes = require('./routes/libro_routes'); // Asegúrate que sea .js si usas CommonJS

app.use('/', webRoutes);
app.use('/', apiRoutes);
app.use('/', libroRoutes);

// ----------------------------------------------------
// 6. INICIAR SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor Express listo en http://localhost:${PORT}`);
});
