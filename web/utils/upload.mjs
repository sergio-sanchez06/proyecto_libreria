import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { fileTypeFromBuffer } from "file-type";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folders = {
  photo: "public/uploads/authors",
  cover: "public/uploads/covers",
  publisher_logo: "public/uploads/publishers",
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = folders[file.fieldname] || "public/uploads/others";
    const fullPath = path.join(__dirname, "..", folder);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const originalName = path.basename(
      file.originalname,
      path.extname(file.originalname),
    );
    const ext = path.extname(file.originalname);
    const cleanName = originalName.replace(/[^a-zA-Z0-9-_]/g, "_");

    let filename = `${cleanName}${ext}`;
    let counter = 1;
    let fullPath = path.join(
      folders[file.fieldname] || "public/uploads/others",
      filename,
    );

    while (fs.existsSync(path.join(__dirname, "..", fullPath))) {
      filename = `${cleanName}_${counter}${ext}`;
      fullPath = path.join(
        folders[file.fieldname] || "public/uploads/others",
        filename,
      );
      counter++;
    }

    cb(null, filename);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: async (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // 1. Verificar extensión
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("Extensión de archivo no permitida"));
    }

    // 2. Verificar MIME type declarado
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Tipo de archivo no permitido"));
    }

    cb(null, true);
  },
});

export default uploadImage;
