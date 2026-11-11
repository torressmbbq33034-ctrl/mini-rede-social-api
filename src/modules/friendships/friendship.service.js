// CONEXÃO COM O MODEL DE AMIZADES
const friendshipModel = require("./friendship.model");

const userModel = require("../users/user.model");

// ENVIA UM PEDIDO DE AMIZADE
function sendRequest(requesterId, addresseeId) {
  // NÃO PERMITE ENVIAR PEDIDO PARA SI MESMO
  if (requesterId === addresseeId) {
    throw new Error("Você não pode enviar um pedido para si mesmo");
  }

  // VERIFICA SE O USUÁRIO DESTINATÁRIO EXISTE
  const addressee = userModel.findById(addresseeId);

  if (!addressee) {
    throw new Error("Usuário destinatário não encontrado");
  }

  // VERIFICA SE JÁ EXISTE UMA RELAÇÃO ENTRE OS USUÁRIOS
  const existingFriendship = friendshipModel.findFriendship(
    requesterId,
    addresseeId,
  );

  // IMPEDE PEDIDO DUPLICADO OU NOVO PEDIDO QUANDO JÁ EXISTE RELAÇÃO
  if (existingFriendship) {
    throw new Error("Já existe uma relação entre esses usuários");
  }

  // CRIA O PEDIDO NO BANCO
  const friendship = friendshipModel.createFriendship(requesterId, addresseeId);

  return friendship;
}

// BUSCA OS PEDIDOS DE AMIZADE RECEBIDOS
function getPendingRequests(userId) {
  const requests = friendshipModel.getPendingRequests(userId);

  return requests;
}

// ACEITA UM PEDIDO DE AMIZADE
function acceptFriendship(friendshipId, userId) {
  const friendship = friendshipModel.acceptFriendship(friendshipId, userId);

  if (!friendship) {
    throw new Error(
      "Pedido não encontrado ou você não pode aceitar este pedido",
    );
  }

  return friendship;
}

// RECUSA UM PEDIDO DE AMIZADE
function rejectFriendship(friendshipId, userId) {
  const friendship = friendshipModel.rejectFriendship(friendshipId, userId);

  if (!friendship) {
    throw new Error(
      "Pedido não encontrado ou você não pode recusar este pedido",
    );
  }

  return friendship;
}

// BUSCA AS AMIZADES ACEITAS DO USUÁRIO
function getFriends(userId) {
  const friends = friendshipModel.getFriends(userId);

  return friends;
}

// REMOVE UMA AMIZADE
function removeFriendship(friendshipId, userId) {
  const friendship = friendshipModel.removeFriendship(friendshipId, userId);

  if (!friendship) {
    throw new Error("Amizade não encontrada ou você não pode removê-la");
  }

  return friendship;
}

// VERIFICA SE DOIS USUÁRIOS SÃO AMIGOS
function areFriends(userId, otherUserId) {
  const friendship = friendshipModel.areFriends(userId, otherUserId);

  return Boolean(friendship);
}

// BUSCA O STATUS DA RELAÇÃO ENTRE DOIS USUÁRIOS
function getFriendshipStatus(userId, otherUserId) {
  if (userId === otherUserId) {
    return {
      status: "self",
    };
  }

  return friendshipModel.getFriendshipStatus(userId, otherUserId);
}

module.exports = {
  sendRequest,
  getPendingRequests,
  acceptFriendship,
  rejectFriendship,
  getFriends,
  removeFriendship,
  areFriends,
  getFriendshipStatus,
};
