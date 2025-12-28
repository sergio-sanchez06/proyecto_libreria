import multer from "multer";

// Carpeta temporal para recibir archivos desde el formulario
const upload = multer({ dest: "./temp" });

export default upload;
