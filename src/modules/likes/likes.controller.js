const likeService = require("./likes.service");

// CURTIR UM POST
function createLike(req, res) {
  try {
    // ID do usuário vem do token JWT
    const userId = req.user.id;

    // ID do post vem da URL
    const postId = Number(req.params.id);

    // Verifica se o ID do post é válido
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    // Cria o like
    const result = likeService.createLike(userId, postId);

    // Post não encontrado
    if (result.error === "Post não encontrado") {
      return res.status(404).json(result);
    }

    // Usuário já curtiu
    if (result.error === "Você já curtiu este post") {
      return res.status(400).json(result);
    }

    // Like criado
    return res.status(201).json(result);
  } catch (error) {
    console.error("ERRO AO CURTIR POST:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// DESCURTIR UM POST
function removeLike(req, res) {
  try {
    // ID do usuário vem do token JWT
    const userId = req.user.id;

    // ID do post vem da URL
    const postId = Number(req.params.id);

    // Verifica se o ID do post é válido
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    // Remove o like
    const result = likeService.removeLike(userId, postId);

    // Post não encontrado
    if (result.error === "Post não encontrado") {
      return res.status(404).json(result);
    }

    // Usuário ainda não curtiu
    if (result.error === "Você ainda não curtiu este post") {
      return res.status(400).json(result);
    }

    // Like removido
    return res.status(200).json(result);
  } catch (error) {
    console.error("ERRO AO DESCURTIR POST:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

// CONTAR LIKES
function countLikes(req, res) {
  try {
    // ID do post vem da URL
    const postId = Number(req.params.id);

    // Verifica se o ID do post é válido
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    // Conta os likes
    const result = likeService.countLikes(postId);

    // Post não encontrado
    if (result.error === "Post não encontrado") {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("ERRO AO CONTAR LIKES:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}
// BUSCA QUEM CURTIU UM POST
function findUsersWhoLikedPost(req, res) {
  try {
    // ID do post vem da URL
    const postId = Number(req.params.id);

    // Verifica se o ID do post é válido
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "ID do post inválido",
      });
    }

    // Busca os usuários que curtiram o post
    const result = likeService.findUsersWhoLikedPost(postId);

    // Post não encontrado
    if (result.error === "Post não encontrado") {
      return res.status(404).json(result);
    }

    // Retorna os usuários
    return res.status(200).json(result);
  } catch (error) {
    console.error("ERRO AO BUSCAR QUEM CURTIU:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}

module.exports = {
  createLike,
  removeLike,
  countLikes,
  findUsersWhoLikedPost,
};
