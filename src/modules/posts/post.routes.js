const express = require("express");

const postController = require("./post.controller");

const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

// ======================================================
// CRIA UM POST
// ======================================================

router.post("/users/:id/posts", authMiddleware, postController.createPost);

// ======================================================
// BUSCA POSTS DE UM USUÁRIO
// ======================================================

router.get("/users/:id/posts", authMiddleware, postController.getPostsByUser);

// ======================================================
// ATUALIZA UM POST
// ======================================================

router.put("/posts/:id", authMiddleware, postController.updatePosts);

// ======================================================
// REMOVE UM POST
// ======================================================

router.delete("/posts/:id", authMiddleware, postController.deletePost);

module.exports = router;
