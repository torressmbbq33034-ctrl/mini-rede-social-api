// ======================================================
// IMPORTA O EXPRESS
// ======================================================

const express = require("express");

// ======================================================
// IMPORTA O CONTROLLER
// ======================================================

const commentController = require("./comment.controller");

// ======================================================
// IMPORTA O MIDDLEWARE DE AUTENTICAÇÃO
// ======================================================

const authMiddleware = require("../../middlewares/auth.middleware");

// ======================================================
// CRIA O ROUTER
// ======================================================

const router = express.Router();

// ======================================================
// CRIAR COMENTÁRIO
// ======================================================

router.post(
  "/posts/:id/comments",
  authMiddleware,
  commentController.createComment,
);

// ======================================================
// LISTAR COMENTÁRIOS DE UM POST
// ======================================================

router.get(
  "/posts/:id/comments",
  authMiddleware,
  commentController.getCommentsByPost,
);

// ======================================================
// EDITAR COMENTÁRIO
// ======================================================

router.put("/comments/:id", authMiddleware, commentController.updateComment);

// ======================================================
// EXCLUIR COMENTÁRIO
// ======================================================

router.delete("/comments/:id", authMiddleware, commentController.deleteComment);

// ======================================================
// EXPORTA AS ROTAS
// ======================================================

module.exports = router;
