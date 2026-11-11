// ======================================================
// IMPORTA O MODEL DE COMENTÁRIOS
// ======================================================

const commentModel = require("./comment.model");

// ======================================================
// IMPORTA A CONEXÃO COM O BANCO
// ======================================================

const db = require("../../config/database");

// ======================================================
// CRIA UM COMENTÁRIO
// ======================================================

function createComment(content, userId, postId) {
  // Verifica se o comentário está vazio
  if (!content || content.trim() === "") {
    return {
      error: "O comentário não pode estar vazio",
    };
  }

  // Verifica se o post existe
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Cria o comentário
  const result = commentModel.createComment(content.trim(), userId, postId);

  return {
    success: true,
    commentId: result.lastInsertRowid,
  };
}

// ======================================================
// BUSCA OS COMENTÁRIOS DE UM POST
// ======================================================

function getCommentsByPost(postId) {
  // Verifica se o post existe
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Busca os comentários
  const comments = commentModel.getCommentsByPost(postId);

  return {
    success: true,
    comments,
  };
}

// ======================================================
// EDITA UM COMENTÁRIO
// ======================================================

function updateComment(commentId, content, userId) {
  // Verifica se o comentário está vazio
  if (!content || content.trim() === "") {
    return {
      error: "O comentário não pode estar vazio",
    };
  }

  // Busca o comentário
  const comment = commentModel.findCommentById(commentId);

  if (!comment) {
    return {
      error: "Comentário não encontrado",
    };
  }

  // Verifica se o comentário pertence ao usuário
  if (comment.user_id !== userId) {
    return {
      error: "Você não pode editar este comentário",
    };
  }

  // Atualiza o comentário
  const result = commentModel.updateComment(commentId, content.trim());

  if (result.changes === 0) {
    return {
      error: "Nenhuma alteração foi realizada",
    };
  }

  return {
    success: true,
    message: "Comentário atualizado com sucesso",
  };
}

// ======================================================
// EXCLUI UM COMENTÁRIO
// ======================================================

function deleteComment(commentId, userId) {
  // Busca o comentário
  const comment = commentModel.findCommentById(commentId);

  if (!comment) {
    return {
      error: "Comentário não encontrado",
    };
  }

  // Verifica se o comentário pertence ao usuário
  if (comment.user_id !== userId) {
    return {
      error: "Você não pode excluir este comentário",
    };
  }

  // Exclui o comentário
  const result = commentModel.deleteComment(commentId);

  if (result.changes === 0) {
    return {
      error: "Nenhuma alteração foi realizada",
    };
  }

  return {
    success: true,
    message: "Comentário excluído com sucesso",
  };
}

// ======================================================
// EXPORTA
// ======================================================

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
