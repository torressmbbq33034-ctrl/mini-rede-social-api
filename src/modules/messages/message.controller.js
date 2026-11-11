const messageService = require("./message.service");

// ======================================================
// BUSCA HISTÓRICO DE UMA CONVERSA
// ======================================================

function getConversation(req, res) {
  try {
    const userId = Number(req.user.id);
    const otherUserId = Number(req.params.userId);

    const messages = messageService.getConversation(userId, otherUserId);

    return res.json(messages);
  } catch (error) {
    return res.status(403).json({
      error: error.message,
    });
  }
}

// ======================================================
// BUSCA A LISTA DE CONVERSAS
// ======================================================

function getConversations(req, res) {
  try {
    const userId = Number(req.user.id);

    const conversations = messageService.getConversations(userId);

    return res.json(conversations);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

// ======================================================
// APAGA O HISTÓRICO DE UMA CONVERSA
// ======================================================

async function deleteConversation(req, res) {
  try {
    const userId = Number(req.user.id);
    const otherUserId = Number(req.params.userId);

    const deleted = await messageService.deleteConversation(
      userId,
      otherUserId,
    );

    return res.status(200).json({
      message: "Conversa apagada com sucesso.",
      deleted,
    });
  } catch (error) {
    console.error("Erro ao apagar conversa:", error);

    return res.status(400).json({
      message: error.message || "Não foi possível apagar a conversa.",
    });
  }
}

module.exports = {
  getConversation,
  getConversations,
  deleteConversation,
};
