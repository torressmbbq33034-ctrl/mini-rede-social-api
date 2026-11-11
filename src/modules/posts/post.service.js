const postModel = require("./post.model");

const friendshipService = require("../friendships/friendship.service");

// ======================================================
// CRIA UM NOVO POST
// ======================================================

function create(content, userId) {
  return postModel.createPost(content, userId);
}

// ======================================================
// BUSCA POSTS DE UM USUÁRIO
// ======================================================

function getPostsByUser(userId, targetUserId) {
  const isFriend = friendshipService.areFriends(userId, targetUserId);

  // O usuário pode visualizar os próprios posts.
  // Posts de outras pessoas só podem ser vistos
  // se forem amigos.

  if (!isFriend && userId !== targetUserId) {
    throw new Error(
      "Você só pode visualizar os posts de usuários que são seus amigos",
    );
  }

  return postModel.getPostsByUser(targetUserId, userId);
}

// ======================================================
// ATUALIZA UM POST
// ======================================================

function update(postId, content, userId) {
  const post = postModel.findPostById(postId);

  // Verifica se o post existe.

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Verifica se o usuário é o dono.

  if (post.user_id !== userId) {
    return {
      error: "Você não pode editar este post",
    };
  }

  return postModel.updatePost(postId, content);
}

// ======================================================
// REMOVE UM POST
// ======================================================

function remove(postId, userId) {
  const post = postModel.findPostById(postId);

  // Verifica se o post existe.

  if (!post) {
    return {
      error: "Post não encontrado",
    };
  }

  // Verifica se o usuário é o dono.

  if (post.user_id !== userId) {
    return {
      error: "Você não pode excluir este post",
    };
  }

  return postModel.deletePost(postId);
}

module.exports = {
  create,
  getPostsByUser,
  update,
  remove,
};
