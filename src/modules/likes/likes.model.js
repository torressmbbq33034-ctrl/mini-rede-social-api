// CONEXÃO COM O BANCO DE DADOS
const db = require("../../config/database");

// BUSCA UM POST PELO ID
function findPostById(postId) {
  const result = db
    .prepare(
      `
      SELECT id
      FROM posts
      WHERE id = ?
    `,
    )
    .get(postId);

  return result;
}

// BUSCA UM LIKE DO USUÁRIO EM UM POST
function findLike(userId, postId) {
  const result = db
    .prepare(
      `
      SELECT id
      FROM likes
      WHERE user_id = ?
      AND post_id = ?
    `,
    )
    .get(userId, postId);

  return result;
}

// CRIA UM LIKE
function createLike(userId, postId) {
  const result = db
    .prepare(
      `
      INSERT INTO likes (user_id, post_id)
      VALUES (?, ?)
    `,
    )
    .run(userId, postId);

  return result;
}

// REMOVE UM LIKE
function removeLike(userId, postId) {
  const result = db
    .prepare(
      `
      DELETE FROM likes
      WHERE user_id = ?
      AND post_id = ?
    `,
    )
    .run(userId, postId);

  return result;
}

// CONTA OS LIKES DE UM POST
function countLikes(postId) {
  const result = db
    .prepare(
      `
      SELECT COUNT(*) AS total
      FROM likes
      WHERE post_id = ?
    `,
    )
    .get(postId);

  return result;
}

// BUSCA OS USUÁRIOS QUE CURTIRAM UM POST
function findUsersWhoLikedPost(postId) {
  const result = db
    .prepare(
      `
      SELECT
        users.id,
        users.name
      FROM likes
      INNER JOIN users
        ON users.id = likes.user_id
      WHERE likes.post_id = ?
      ORDER BY likes.id DESC
    `,
    )
    .all(postId);

  return result;
}

module.exports = {
  findPostById,
  findLike,
  createLike,
  removeLike,
  countLikes,
  findUsersWhoLikedPost,
};
