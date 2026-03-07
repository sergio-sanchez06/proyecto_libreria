import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folders = {
  photo: "public/uploads/authors",
  cover: "public/uploads/covers",
  publisher_logo: "public/uploads/publishers",
};

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
      path.extname(file.originalname)
    );
    const ext = path.extname(file.originalname);
    const cleanName = originalName.replace(/[^a-zA-Z0-9-_]/g, "_");

    let filename = `${cleanName}${ext}`;
    let counter = 1;
    let fullPath = path.join(
      folders[file.fieldname] || "public/uploads/others",
      filename
    );

    while (fs.existsSync(path.join(__dirname, "..", fullPath))) {
      filename = `${cleanName}_${counter}${ext}`;
      fullPath = path.join(
        folders[file.fieldname] || "public/uploads/others",
        filename
      );
      counter++;
    }

    cb(null, filename);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo imágenes"));
  },
});

export default uploadImage;
