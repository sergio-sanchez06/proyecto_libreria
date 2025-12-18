export const getIndex = (req, res) => {
    res.render('index', {
        title: 'Inicio - Librería'
    });
};

export const getLibroDetail = (req, res) => {
    const { id } =req.params;
    res.render('libro_detalle', {
        title: 'Detalle del Libro',
        libroId: id
    });
};

export default {
    getIndex,
    getLibroDetail
};