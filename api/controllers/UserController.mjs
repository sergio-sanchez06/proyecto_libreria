import UserRepository from '../models/Repositories/UserRepository.mjs';

async function getAllUsers(req, res) {
    try {
        const users = await UserRepository.getAllUsers();
        const safeUsers = users.map(user => {
            const { password, ...safeData } = user;
            return safeData;
        });
        res.status(200).json(safeUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
}

async function getUserById(req, res) {
    try {
        const user = await UserRepository.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        
        const { password, ...safeData } = user;
        res.status(200).json(safeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el usuario" });
    }
}

async function updateUser(req, res) {
    try {
        const update_data = { id: req.params.id, ...req.body };
        // Aquí podrías añadir lógica de hashing de password si fuera necesario
        const user = await UserRepository.updateUser(update_data);
        const { password, ...safeData } = user;
        res.status(200).json(safeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el usuario" });
    }
}

async function deleteUser(req, res) {
    try {
        await UserRepository.deleteUser(req.params.id);
        res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el usuario" });
    }
}

export default {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};