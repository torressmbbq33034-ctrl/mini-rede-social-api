const messageModel = require("./message.model");
const friendshipService = require("../friendships/friendship.service");

// ======================================================
// CRIA UMA MENSAGEM
// ======================================================

function createMessage(senderId, receiverId, content) {
  // NÃO PERMITE ENVIAR MENSAGEM PARA SI MESMO
  if (senderId === receiverId) {
    throw new Error("Você não pode enviar mensagem para si mesmo");
  }

  // VERIFICA SE OS USUÁRIOS SÃO AMIGOS
  const areFriends = friendshipService.areFriends(senderId, receiverId);

  if (!areFriends) {
    throw new Error("Você só pode enviar mensagens para amigos");
  }

  return messageModel.createMessage(senderId, receiverId, content);
}

// ======================================================
// BUSCA HISTÓRICO DE UMA CONVERSA
// ======================================================

function getConversation(userId, otherUserId) {
  // NÃO PERMITE CONVERSA COM O PRÓPRIO USUÁRIO
  if (userId === otherUserId) {
    throw new Error("Você não pode abrir uma conversa consigo mesmo");
  }

  // VERIFICA SE OS USUÁRIOS SÃO AMIGOS
  const areFriends = friendshipService.areFriends(userId, otherUserId);

  if (!areFriends) {
    throw new Error("Você só pode visualizar conversas com amigos");
  }

  return messageModel.getConversation(userId, otherUserId);
}

// ======================================================
// APAGA O HISTÓRICO DE UMA CONVERSA
// ======================================================

function deleteConversation(userId, otherUserId) {
  // NÃO PERMITE APAGAR CONVERSA CONSIGO MESMO
  if (userId === otherUserId) {
    throw new Error("Você não pode apagar uma conversa consigo mesmo");
  }

  // VERIFICA SE OS USUÁRIOS SÃO AMIGOS
  const areFriends = friendshipService.areFriends(userId, otherUserId);

  if (!areFriends) {
    throw new Error("Você só pode apagar conversas com amigos");
  }

  return messageModel.deleteConversation(userId, otherUserId);
}

// ======================================================
// BUSCA A LISTA DE CONVERSAS
// ======================================================

function getConversations(userId) {
  return messageModel.getConversations(userId);
}

module.exports = {
  createMessage,
  getConversation,
  deleteConversation,
  getConversations,
};
