import ReviewRepository from '../models/Repositories/ReviewRepository.mjs';

class ReviewController {

    async createReview(req, res) {
        const userId = req.user.id; 
        const { book_id, rating, comment } = req.body;

        if (!book_id || !rating || !comment) {
            return res.status(400).json({ 
                error: 'Faltan campos obligatorios: book_id, rating y comment.' 
            });
        }
        
        try {
            const newReview = await ReviewRepository.createReview({
                user_id: userId,
                book_id,
                rating,
                comment,
            });

            res.status(201).json({ 
                message: 'Reseña creada exitosamente.', 
                review: newReview 
            });

        } catch (error) {
            console.error('Error al crear reseña:', error);
            if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Ya has dejado una reseña para este libro. Intenta actualizarla.'
                });
            }
            res.status(500).json({ 
                error: 'Error interno del servidor al crear la reseña.' 
            });
        }
    }


    async getReviewsByBookId(req, res) {
        const { book_id } = req.params;

        try {
            const reviews = await ReviewRepository.getReviewByBookId(book_id);
            
            res.status(200).json(reviews);
        } catch (error) {
            console.error('Error al obtener reseñas por libro:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al obtener las reseñas.' 
            });
        }
    }

    async deleteReview(req, res) {
        const { id } = req.params;
        const userId = req.user.id; 

        try {
            const review = await ReviewRepository.getReviewById(id);

            if (!review) {
                return res.status(404).json({ error: 'Reseña no encontrada.' });
            }

            if (review.user_id !== userId) {
                 return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña.' });
            }

            await ReviewRepository.deleteReview(id);

            res.status(200).json({ message: 'Reseña eliminada exitosamente.' });

        } catch (error) {
            console.error('Error al eliminar reseña:', error);
            res.status(500).json({ error: 'Error interno del servidor al eliminar la reseña.' });
        }
    }

}

export default new ReviewController();