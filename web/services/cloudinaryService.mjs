import { v2 as cloudinary } from "cloudinary";

/**
 * @param {Buffer} fileBuffer - El buffer del archivo (req.file.buffer)
 * @param {String} folder - Carpeta en Cloudinary (ej: 'libros', 'autores')
 */

// Configuración usando variables de entorno
export const uploadToCloudinary = (fileBuffer, folder) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Nos devuelve la URL de internet
      },
    );
    // Enviamos el buffer del archivo al stream de Cloudinary
    uploadStream.end(fileBuffer);
  });
};
