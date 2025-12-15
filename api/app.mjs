import express from "express";
import cors from "cors";
import bookRouter from "./router/BookRouter";
import authorRouter from "./router/AuthorRouter";
import genreRouter from "./router/GenreRouter";
import publisherRouter from "./router/PublisherRouter";
import orderRouter from "./router/OrdersRouter";
import authRouter from "./router/AuthRouter";

const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/books", bookRouter);
app.use("/authors", authorRouter);
app.use("/genres", genreRouter);
app.use("/publishers", publisherRouter);
app.use("/orders", orderRouter);
app.use("/auth", authRouter);

app.use(
  "/api/orders",
  async (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });
    try {
      await verifyTokenAndSyncUser(token);
      next();
    } catch (error) {
      res.status(401).json({ error: "Token inválido" });
    }
  },
  orderRouter
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
