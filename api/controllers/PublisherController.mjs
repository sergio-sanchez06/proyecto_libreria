import PublisherRepository from "../Repositories/PublisherRepository.mjs";

async function createPublisher(req, res) {
  try {
    const publisher = await PublisherRepository.createPublisher(req.body);
    res.status(201).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el editor" });
  }
}

async function getPublisherById(req, res) {
  try {
    const publisher = await PublisherRepository.getPublisherById(req.params.id);
    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el editor" });
  }
}

async function getPublisherByName(req, res) {
  try {
    const publisher = await PublisherRepository.getPublisherByName(
      req.params.name
    );
    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el editor" });
  }
}

async function updatePublisher(req, res) {
  try {
    const update_data = { id: req.params.id, ...req.body }; // Crea un objeto que añade el id al resto de parámetros del body
    const publisher = await PublisherRepository.updatePublisher(update_data);
    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el editor" });
  }
}

async function deletePublisher(req, res) {
  try {
    const publisher = await PublisherRepository.deletePublisher(req.params.id);
    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el editor" });
  }
}

async function getAllPublishers(req, res) {
  try {
    const publishers = await PublisherRepository.getAllPublishers();
    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}

async function getPublisherByCountry(req, res) {
  try {
    const publishers = await PublisherRepository.getPublisherByCountry(
      req.params.country
    );
    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}

async function getPublishersMostSold(req, res) {
  try {
    const publishers = await PublisherRepository.getPublishersMostSold();
    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}

export default {
  createPublisher,
  getPublisherById,
  getPublisherByName,
  updatePublisher,
  deletePublisher,
  getAllPublishers,
  getPublisherByCountry,
  getPublishersMostSold,
};
