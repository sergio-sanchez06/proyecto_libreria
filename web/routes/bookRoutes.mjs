import express from "express";
import BookController from "../controllers/BookController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get("/", BookController.list);
router.get("/book/:id", BookController.getLibroDetail);

router.get("/edit/:id", BookController.getEdit);
router.post("/update/:id", upload.single("cover"), BookController.update);

router.get("/create", BookController.getCreate);
router.post("/create", upload.single("cover"), BookController.create);

router.get("/delete/:id", BookController.getDelete);
router.post("/delete/:id", BookController.remove);

export default router;
