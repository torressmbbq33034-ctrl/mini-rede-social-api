// ======================================================
// CONEXÃO COM O BANCO DE DADOS
// ======================================================

const db = require("../../config/database");

// ======================================================
// CRIA UM COMENTÁRIO
// ======================================================

function createComment(content, userId, postId) {
  const sql = `
    INSERT INTO comments (content, user_id, post_id)
    VALUES (?, ?, ?)
  `;

  const result = db.prepare(sql).run(content, userId, postId);

  return result;
}

// ======================================================
// BUSCA OS COMENTÁRIOS DE UM POST
// ======================================================

function getCommentsByPost(postId) {
  const sql = `
    SELECT
      id,
      content,
      user_id,
      post_id,
      created_at
    FROM comments
    WHERE post_id = ?
    ORDER BY created_at ASC
  `;

  const comments = db.prepare(sql).all(postId);

  return comments;
}

// ======================================================
// BUSCA UM COMENTÁRIO PELO ID
// ======================================================

function findCommentById(commentId) {
  const sql = `
    SELECT
      id,
      content,
      user_id,
      post_id,
      created_at
    FROM comments
    WHERE id = ?
  `;

  const comment = db.prepare(sql).get(commentId);

  return comment;
}

// ======================================================
// ATUALIZA UM COMENTÁRIO
// ======================================================

function updateComment(commentId, content) {
  const sql = `
    UPDATE comments
    SET content = ?
    WHERE id = ?
  `;

  const result = db.prepare(sql).run(content, commentId);

  return result;
}

// ======================================================
// EXCLUI UM COMENTÁRIO
// ======================================================

function deleteComment(commentId) {
  const sql = `
    DELETE FROM comments
    WHERE id = ?
  `;

  const result = db.prepare(sql).run(commentId);

  return result;
}

// ======================================================
// EXPORTA
// ======================================================

module.exports = {
  createComment,
  getCommentsByPost,
  findCommentById,
  updateComment,
  deleteComment,
};
