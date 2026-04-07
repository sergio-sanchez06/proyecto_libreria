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
      req.params.name,
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

// async function deletePublisher(req, res) {
//   const { id } = req.params;

//   try {
//     await PublisherBookService.archivePublisherAndBooks(id);

//     res.status(200).json({
//       status: "success",
//       message: "Editorial y sus libros asociados han sido archivados.",
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: error.message,
//     });
//   }
// }
async function deletePublisher(req, res) {
  try {
    const publisher = await PublisherRepository.deletePublisher(req.params.id);
    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el editor" });
  }
}

/*async function getAllPublishers(req, res) {
  try {
    const publishers = await PublisherRepository.getAllPublishers();
    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}*/

async function getAllPublishers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const publishersData = await PublisherRepository.getAllPublishers(
      page,
      limit,
    );

    res.status(200).json(publishersData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}

async function getPublisherByCountry(req, res) {
  try {
    const publishers = await PublisherRepository.getPublisherByCountry(
      req.params.country,
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

async function getPublishers(req, res) {
  try {
    const publishers = await PublisherRepository.getPublishers();
    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los editores" });
  }
}

async function restorePublisher(req, res) {
  const { id } = req.params; // El ID de la editorial que viene en la URL

  try {
    // Llamamos al nuevo método del servicio que coordina la restauración
    await PublisherRepository.restorePublisher(id);

    // Si todo va bien, respondemos con éxito
    return res.status(200).json({
      status: "success",
      message: "La editorial ha sido restaurada correctamente.",
    });
  } catch (error) {
    console.error("Error al restaurar editorial:", error.message);

    return res.status(500).json({
      status: "error",
      message: "No se pudo completar la restauración de la editorial.",
    });
  }
}
// async function restorePublisher(req, res) {
//   const { id } = req.params; // El ID de la editorial que viene en la URL

//   try {
//     // Llamamos al nuevo método del servicio que coordina la restauración
//     await PublisherBookService.restorePublisherAndBooks(id);

//     // Si todo va bien, respondemos con éxito
//     return res.status(200).json({
//       status: "success",
//       message:
//         "La editorial y todos sus libros han sido restaurados correctamente.",
//     });
//   } catch (error) {
//     // Si el servicio lanza un error (ej. fallo en la transacción), lo capturamos
//     console.error("Error al restaurar editorial:", error.message);

//     return res.status(500).json({
//       status: "error",
//       message: "No se pudo completar la restauración de la editorial.",
//     });
//   }
// }

export default {
  createPublisher,
  getPublisherById,
  getPublisherByName,
  updatePublisher,
  deletePublisher,
  getAllPublishers,
  getPublisherByCountry,
  getPublishersMostSold,
  getPublishers,
  restorePublisher,
};
