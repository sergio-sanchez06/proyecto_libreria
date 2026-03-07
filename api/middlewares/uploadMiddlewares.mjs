import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_UPLOADS_PATH = path.join(__dirname, "../../web/public/uploads");

const folders = {
  author_photo: path.join(WEB_UPLOADS_PATH, "authors"),
  cover: path.join(WEB_UPLOADS_PATH, "covers"),
  publisher_logo: path.join(WEB_UPLOADS_PATH, "publishers"),
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder =
      folders[file.fieldname] || path.join(WEB_UPLOADS_PATH, "others");
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const uploadImage = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
export default uploadImage;
