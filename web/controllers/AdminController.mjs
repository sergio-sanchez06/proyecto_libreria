export const getManageBooks = (req, res) => {
    res.render('admin/libros', {
        title: 'Gestión de Libros'
    });
};

export const getForm = (req, res) => {
    const { type } = req.params;
    res.render('admin/form_general', {
        title: `Gestionar ${type}`,
        type: type
    });
};

export default {
    getDashboard,
    getManageBooks,
    getForm
};