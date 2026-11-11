const db = require("../../config/database");

// ======================================================
// CRIA UM NOVO POST
// ======================================================

function createPost(content, user_id) {
  const sql = `
    INSERT INTO posts (content, user_id)
    VALUES (?, ?)
  `;

  const result = db.prepare(sql).run(content, user_id);

  return {
    id: result.lastInsertRowid,
    content,
    user_id,
  };
}

// ======================================================
// BUSCA POSTS DE UM USUÁRIO
// ======================================================

function getPostsByUser(user_id, currentUserId) {
  const sql = `
    SELECT
      posts.id,
      posts.content,
      posts.user_id,

      (
        SELECT COUNT(*)
        FROM likes
        WHERE likes.post_id = posts.id
      ) AS likes,

      (
        SELECT COUNT(*)
        FROM comments
        WHERE comments.post_id = posts.id
      ) AS comments,

      EXISTS (
        SELECT 1
        FROM likes
        WHERE likes.post_id = posts.id
        AND likes.user_id = ?
      ) AS likedByMe

    FROM posts

    WHERE posts.user_id = ?

    ORDER BY posts.id DESC
  `;

  const posts = db.prepare(sql).all(currentUserId, user_id);

  return posts.map((post) => ({
    ...post,
    likedByMe: Boolean(post.likedByMe),
  }));
}

// ======================================================
// BUSCA UM POST PELO ID
// ======================================================

function findPostById(postId) {
  const sql = `
    SELECT
      id,
      content,
      user_id
    FROM posts
    WHERE id = ?
  `;

  return db.prepare(sql).get(postId);
}

// ======================================================
// ATUALIZA UM POST
// ======================================================

function updatePost(postId, content) {
  const sql = `
    UPDATE posts
    SET content = ?
    WHERE id = ?
  `;

  const result = db.prepare(sql).run(content, postId);

  return {
    id: postId,
    content,
    changes: result.changes,
  };
}

// ======================================================
// REMOVE UM POST
// ======================================================

function deletePost(postId) {
  const transaction = db.transaction(() => {
    // 1. Remove os likes do post
    db.prepare(
      `
      DELETE FROM likes
      WHERE post_id = ?
    `,
    ).run(postId);

    // 2. Remove os comentários do post
    db.prepare(
      `
      DELETE FROM comments
      WHERE post_id = ?
    `,
    ).run(postId);

    // 3. Remove o post
    const result = db
      .prepare(
        `
      DELETE FROM posts
      WHERE id = ?
    `,
      )
      .run(postId);

    return {
      id: postId,
      changes: result.changes,
    };
  });

  return transaction();
}

// ======================================================
// EXPORTA
// ======================================================

module.exports = {
  createPost,
  getPostsByUser,
  findPostById,
  updatePost,
  deletePost,
};
