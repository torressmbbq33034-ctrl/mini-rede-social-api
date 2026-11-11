const likeModel = require("./likes.model");

// CURTIR UM POST
function createLike(userId, postId) {
  // Verifica se o post existe
  const post = likeModel.findPostById(postId);

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Verifica se o usuário já curtiu
  const existingLike = likeModel.findLike(userId, postId);

  if (existingLike) {
    return {
      error: "Você já curtiu este post",
    };
  }

  // Cria o like
  const result = likeModel.createLike(userId, postId);

  return {
    success: true,
    likeId: result.lastInsertRowid,
  };
}

// DESCURTIR UM POST
function removeLike(userId, postId) {
  // Verifica se o post existe
  const post = likeModel.findPostById(postId);

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Verifica se existe o like
  const existingLike = likeModel.findLike(userId, postId);

  if (!existingLike) {
    return {
      error: "Você ainda não curtiu este post",
    };
  }

  // Remove o like
  likeModel.removeLike(userId, postId);

  return {
    success: true,
  };
}

// CONTAR LIKES
function countLikes(postId) {
  // Verifica se o post existe
  const post = likeModel.findPostById(postId);

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  const result = likeModel.countLikes(postId);

  return {
    total: result.total,
  };
}

// BUSCA QUEM CURTIU UM POST
function findUsersWhoLikedPost(postId) {
  const post = likeModel.findPostById(postId);

  // Verifica se o post existe
  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  const users = likeModel.findUsersWhoLikedPost(postId);

  return {
    users,
  };
}
module.exports = {
  createLike,
  removeLike,
  countLikes,
  findUsersWhoLikedPost,
};
