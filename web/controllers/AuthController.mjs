export const getLogin = (req, res) => {
    try {
        res.render('login', { title: 'Iniciar Sesión' });
    } catch (error) {
        console.error("Error al cargar el login:", error);
        res.status(500).send("Error al cargar la página");
    }
};

export const getRegister = (req, res) => {
    try {
        res.render('register', { title: 'Registro de Usuario' });
    } catch (error) {
        console.error("Error al cargar el registro:", error);
        res.status(500).send("Error al cargar la página");
    }
};

export default {
    getLogin,
    getRegister
};