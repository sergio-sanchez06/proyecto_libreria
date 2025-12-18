export const getProfile = (req, res) => {
    res.render('Perfil', {
        title: 'Mi perfil'
    });
};

export const getPurchaseHistory = (req, res) => {
    res.render('historial_compras', {
        title: 'Mis compras'
    });
};

export const getMyReviews = (req, res) => {
    res.render('mis_reseñas', {
        title: 'Mis Reseñas'
    });
};

export default {
    getProfile,
    getPurchaseHistory,
    getMyReviews
};