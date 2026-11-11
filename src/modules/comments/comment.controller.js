// ======================================================
// IMPORTA O SERVICE DE COMENTÁRIOS
// ======================================================

const commentService = require("./comment.service");

// ======================================================
// CRIA UM COMENTÁRIO
// ======================================================

function createComment(req, res) {
  try {
    // Verifica se o corpo da requisição existe e é válido.
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Corpo da requisição inválido ou ausente",
      });
    }

    const { content } = req.body;

    // Verifica se o conteúdo é uma string válida.
    if (typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({
        message: "O conteúdo do comentário é obrigatório",
      });
    }

    const postId = Number(req.params.id);
    const userId = Number(req.user.id);

    const resultado = commentService.createComment(
      content.trim(),
      userId,
      postId,
    );

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    return res.status(201).json(resultado);
  } catch (error) {
    console.error("Erro ao criar comentário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// ======================================================
// LISTA OS COMENTÁRIOS
// ======================================================

function getCommentsByPost(req, res) {
  try {
    const postId = Number(req.params.id);

    const resultado = commentService.getCommentsByPost(postId);

    if (resultado.error) {
      return res.status(404).json({
        message: resultado.error,
      });
    }

    // Retorna somente o array de comentários.
    return res.status(200).json(resultado.comments);
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// ======================================================
// EDITA UM COMENTÁRIO
// ======================================================

function updateComment(req, res) {
  try {
    const commentId = Number(req.params.id);
    const userId = Number(req.user.id);

    // Verifica se o corpo da requisição existe e é válido.
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Corpo da requisição inválido ou ausente",
      });
    }

    const { content } = req.body;

    // Verifica se o conteúdo é uma string válida.
    if (typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({
        message: "O conteúdo do comentário é obrigatório",
      });
    }

    const resultado = commentService.updateComment(
      commentId,
      content.trim(),
      userId,
    );

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao editar comentário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// ======================================================
// EXCLUI UM COMENTÁRIO
// ======================================================

function deleteComment(req, res) {
  try {
    const commentId = Number(req.params.id);
    const userId = Number(req.user.id);

    const resultado = commentService.deleteComment(commentId, userId);

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao excluir comentário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
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
