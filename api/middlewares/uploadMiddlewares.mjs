import multer from "multer";
import path from "path";
import fs from "fs";

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Creamos la ruta relativa a la raíz del proyecto
    const route = "public/img/authors/";

    // Verificamos si la carpeta existe, si no, la creamos
    if (!fs.existsSync(route)) {
      fs.mkdirSync(route, { recursive: true });
    }
    cb(null, route);
  },
  filename: function (req, file, cb) {
    // Nombre: idDelAutor-timestamp.extensión
    const authorId = req.params.id || "new";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `author-${authorId}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"), false);
  }
};

const uploadAuthorPhoto = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

export default uploadAuthorPhoto;
