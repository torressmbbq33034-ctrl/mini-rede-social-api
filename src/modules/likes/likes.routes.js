const express = require("express");

const likeController = require("./likes.controller");

const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

// CURTIR UM POST
router.post("/posts/:id/likes", authMiddleware, likeController.createLike);

// DESCURTIR UM POST
router.delete("/posts/:id/likes", authMiddleware, likeController.removeLike);

// CONTAR LIKES DE UM POST
router.get("/posts/:id/likes", authMiddleware, likeController.countLikes);

// BUSCAR QUEM CURTIU UM POST
router.get(
  "/posts/:id/likes/users",
  authMiddleware,
  likeController.findUsersWhoLikedPost,
);

module.exports = router;
