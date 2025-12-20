import express from "express";
import cors from "cors";
import bookRouter from "./router/BookRouter.mjs";
import authorRouter from "./router/AuthorRouter.mjs";
import genreRouter from "./router/GenreRouter.mjs";
import publisherRouter from "./router/PublisherRouter.mjs";
import orderRouter from "./router/OrdersRouter.mjs";
import authRouter from "./router/AuthRouter.mjs";
import userRouter from "./router/UserRouter.mjs";
import bookAuthorRouter from "./router/BookAuthorRouter.mjs";
// import userRouter from "./router/UserRouter.mjs";



const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use
app.use("/books", bookRouter);
app.use("/authors", authorRouter);
app.use("/genres", genreRouter);
app.use("/publishers", publisherRouter);
app.use("/orders", orderRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);

app.use("/bookAuthor", bookAuthorRouter)

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
