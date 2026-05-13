import express from "express";
import UserController from "../controllers/UserController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";
import { validateSchema } from "../middlewares/validator.mjs";
import { userSchema } from "../schemas/userSchema.mjs";

const router = express.Router();

router.get("/profile", protectMiddleware.protect, UserController.getProfile);
router.get(
  "/myOrders",
  protectMiddleware.protect,
  UserController.getPurchaseHistory,
);
router.get(
  "/edit/:id",
  protectMiddleware.protect,
  UserController.getEditProfileForm,
);
router.post(
  "/edit/:id",
  protectMiddleware.protect,
  protectMiddleware.requireFreshToken,
  (req, res, next) => {
    req.viewToRender = "partials/editUserProfile";
    req.entityName = "user";
    next();
  },
  validateSchema(userSchema),
  UserController.updateProfile,
);

router.post(
  "/dismissSelf",
  protectMiddleware.protect,
  protectMiddleware.requireFreshToken,
  UserController.dismissSelf,
);

router.get(
  // Adicion de ruta para obtener las reseñas del usuario
  "/myReviews",
  protectMiddleware.protect,
  UserController.getMyReviews,
);

router.get(
  "/changePass",
  protectMiddleware.protect,
  UserController.changeMyPass,
);

router.post(
  "/changePass",
  protectMiddleware.protect,
  UserController.changeMyPassReturn,
);

router.post(
  "/favorites/:userId",
  protectMiddleware.protect,
  protectMiddleware.requireFreshToken,
  UserController.saveFavoriteGenres,
);

// Página de gestión de géneros favoritos
router.get(
  "/favorites",
  protectMiddleware.protect,
  UserController.getFavoritesPage,
);

// Página de recomendaciones personalizadas
router.get(
  "/recommendations",
  protectMiddleware.protect,
  UserController.getRecommendationsPage,
);

router.post(
  "/cancel/order/:id",
  protectMiddleware.protect,
  protectMiddleware.requireFreshToken,
  UserController.cancelOrder,
)

router.post(
  "/request-return/order/:id",
  protectMiddleware.protect,
  protectMiddleware.requireFreshToken,
  UserController.userRequestReturn,
)

export default router;
