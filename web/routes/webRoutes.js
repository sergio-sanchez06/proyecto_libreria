const express = require('express');
const router = express.Router();
const webController = require('../controllers/webController');

router.get("/", webController.showAllLibros); 

router.get("/login", webController.showLoginForm);


router.get("/admin", 
    webController.requireLogin,          // Primero: Asegura que el usuario esté logueado
    webController.checkRole('administrador'), // Segundo: Asegura que el rol sea 'administrador'
    webController.showAdminPanel
);

module.exports = router;