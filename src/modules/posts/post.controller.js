const postService = require("./post.service");

// ======================================================
// CRIA UM NOVO POST
// ======================================================

function createPost(req, res) {
  try {
    const userId = req.user.id;

    // Verifica se o corpo da requisição existe e é válido.
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Corpo da requisição inválido ou ausente",
      });
    }

    const contentText = req.body.content;

    if (typeof contentText !== "string" || contentText.trim() === "") {
      return res.status(400).json({
        message: "O conteúdo do post é obrigatório",
      });
    }

    const post = postService.create(contentText.trim(), userId);

    return res.status(201).json(post);
  } catch (error) {
    console.error("Erro ao criar post:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// ======================================================
// BUSCA POSTS DE UM USUÁRIO
// ======================================================

function getPostsByUser(req, res) {
  try {
    const userId = req.user.id;
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId)) {
      return res.status(400).json({
        message: "ID do usuário inválido",
      });
    }

    const posts = postService.getPostsByUser(userId, targetUserId);

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);

    return res.status(403).json({
      message: error.message,
    });
  }
}

// ======================================================
// ATUALIZA UM POST
// ======================================================

function updatePosts(req, res) {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(postId)) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    // Verifica se o corpo da requisição existe e é válido.
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Corpo da requisição inválido ou ausente",
      });
    }

    const contentText = req.body.content;

    if (typeof contentText !== "string" || contentText.trim() === "") {
      return res.status(400).json({
        message: "O conteúdo do post é obrigatório",
      });
    }

    const result = postService.update(postId, contentText.trim(), userId);

    if (result.error === "Post não encontrado") {
      return res.status(404).json({
        message: result.error,
      });
    }

    if (result.error === "Você não pode editar este post") {
      return res.status(403).json({
        message: result.error,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao atualizar post:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// ======================================================
// REMOVE UM POST
// ======================================================

function deletePost(req, res) {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(postId)) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    const result = postService.remove(postId, userId);

    if (result.error === "Post não encontrado") {
      return res.status(404).json({
        message: result.error,
      });
    }

    if (result.error === "Você não pode excluir este post") {
      return res.status(403).json({
        message: result.error,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao excluir post:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

module.exports = {
  createPost,
  getPostsByUser,
  updatePosts,
  deletePost,
};
