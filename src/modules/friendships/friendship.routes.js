// IMPORTA O EXPRESS
const express = require("express");

// IMPORTA O CONTROLLER DE AMIZADES
const friendshipController = require("./friendship.controller");

// IMPORTA O MIDDLEWARE DE AUTENTICAÇÃO
const authMiddleware = require("../../middlewares/auth.middleware");

// CRIA O ROUTER
const router = express.Router();

// ENVIA UM PEDIDO DE AMIZADE
router.post(
  "/friendships/:id",
  authMiddleware,
  friendshipController.sendRequest,
);

// BUSCA OS PEDIDOS DE AMIZADE RECEBIDOS
router.get(
  "/friendships/requests",
  authMiddleware,
  friendshipController.getPendingRequests,
);

// ACEITA UM PEDIDO DE AMIZADE
router.put(
  "/friendships/:id/accept",
  authMiddleware,
  friendshipController.acceptFriendship,
);

// RECUSA UM PEDIDO DE AMIZADE
router.put(
  "/friendships/:id/reject",
  authMiddleware,
  friendshipController.rejectFriendship,
);

// BUSCA AS AMIZADES ACEITAS DO USUÁRIO
router.get("/friendships", authMiddleware, friendshipController.getFriends);

// REMOVE UMA AMIZADE
router.delete(
  "/friendships/:id",
  authMiddleware,
  friendshipController.removeFriendship,
);

// BUSCA O STATUS DA RELAÇÃO COM OUTRO USUÁRIO
router.get(
  "/friendships/status/:id",
  authMiddleware,
  friendshipController.getFriendshipStatus,
);

// EXPORTA AS ROTAS
module.exports = router;
