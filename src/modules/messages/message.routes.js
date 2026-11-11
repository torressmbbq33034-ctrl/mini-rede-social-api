const express = require("express");

const messageController = require("./message.controller");

const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

// ======================================================
// BUSCA LISTA DE CONVERSAS
// ======================================================

router.get(
  "/conversations",
  authMiddleware,
  messageController.getConversations,
);

// ======================================================
// BUSCA HISTÓRICO DE UMA CONVERSA
// ======================================================

router.get(
  "/conversations/:userId/messages",
  authMiddleware,
  messageController.getConversation,
);

// ======================================================
// APAGA O HISTÓRICO DE UMA CONVERSA
// ======================================================

router.delete(
  "/conversations/:userId/messages",
  authMiddleware,
  messageController.deleteConversation,
);

module.exports = router;
