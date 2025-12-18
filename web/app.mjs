import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';

import authRoutes from './routes/authRoutes.mjs';
import bookRoutes from './routes/bookRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import adminRoutes from './routes/adminRoutes.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'CLAVE_SECRETA_POR_DEFECTO',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);
app.use('/', bookRoutes);
app.use('/cuenta', userRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Servidor Web listo en http://localhost:${PORT}`);
});