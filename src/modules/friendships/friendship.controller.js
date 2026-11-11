// CONEXÃO COM O SERVICE DE AMIZADES
const friendshipService = require("./friendship.service");

// ENVIA UM PEDIDO DE AMIZADE

function sendRequest(req, res) {
  try {
    const requesterId = req.user.id;
    const addresseeId = Number(req.params.id);

    // Valida se o ID recebido é um número válido.
    if (!Number.isInteger(addresseeId) || addresseeId <= 0) {
      return res.status(400).json({
        message: "ID do destinatário inválido",
      });
    }

    const friendship = friendshipService.sendRequest(requesterId, addresseeId);

    return res.status(201).json({
      message: "Pedido de amizade enviado com sucesso",
      friendship,
    });
  } catch (error) {
    console.error("ERRO AO ENVIAR PEDIDO DE AMIZADE:", error);

    // Distingue um usuário inexistente dos demais erros de validação.
    if (error.message === "Usuário destinatário não encontrado") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao enviar pedido de amizade",
    });
  }
}

// BUSCA OS PEDIDOS DE AMIZADE RECEBIDOS
function getPendingRequests(req, res) {
  try {
    const userId = req.user.id;
    const requests = friendshipService.getPendingRequests(userId);

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao buscar pedidos",
    });
  }
}

// ACEITA UM PEDIDO DE AMIZADE
function acceptFriendship(req, res) {
  try {
    const friendshipId = Number(req.params.id);
    const userId = req.user.id;

    const friendship = friendshipService.acceptFriendship(friendshipId, userId);

    return res.status(200).json({
      message: "Pedido de amizade aceito com sucesso",
      friendship,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao aceitar pedido",
    });
  }
}

// RECUSA UM PEDIDO DE AMIZADE
function rejectFriendship(req, res) {
  try {
    const friendshipId = Number(req.params.id);
    const userId = req.user.id;

    const friendship = friendshipService.rejectFriendship(friendshipId, userId);

    return res.status(200).json({
      message: "Pedido de amizade recusado com sucesso",
      friendship,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao recusar pedido",
    });
  }
}

// BUSCA AS AMIZADES ACEITAS DO USUÁRIO
function getFriends(req, res) {
  try {
    const userId = req.user.id;
    const friends = friendshipService.getFriends(userId);

    return res.status(200).json(friends);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao buscar amizades",
    });
  }
}

// REMOVE UMA AMIZADE
function removeFriendship(req, res) {
  try {
    const friendshipId = Number(req.params.id);
    const userId = req.user.id;

    const friendship = friendshipService.removeFriendship(friendshipId, userId);

    return res.status(200).json({
      message: "Amizade removida com sucesso",
      friendship,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao remover amizade",
    });
  }
}

// BUSCA O STATUS DA RELAÇÃO COM OUTRO USUÁRIO
function getFriendshipStatus(req, res) {
  try {
    const userId = req.user.id;
    const otherUserId = Number(req.params.id);

    const status = friendshipService.getFriendshipStatus(userId, otherUserId);

    return res.status(200).json(status);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao consultar relação",
    });
  }
}

module.exports = {
  sendRequest,
  getPendingRequests,
  acceptFriendship,
  rejectFriendship,
  getFriends,
  removeFriendship,
  getFriendshipStatus,
};
