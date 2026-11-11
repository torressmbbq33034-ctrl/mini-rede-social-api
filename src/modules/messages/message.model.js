const db = require("../../config/database");

// ======================================================
// CRIA UMA MENSAGEM
// ======================================================

function createMessage(senderId, receiverId, content) {
  const statement = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES (?, ?, ?)
  `);

  const result = statement.run(senderId, receiverId, content);

  return db
    .prepare(
      `
      SELECT
        id,
        sender_id AS senderId,
        receiver_id AS receiverId,
        content,
        created_at AS createdAt
      FROM messages
      WHERE id = ?
    `,
    )
    .get(result.lastInsertRowid);
}

// ======================================================
// BUSCA HISTÓRICO DE UMA CONVERSA
// ======================================================

function getConversation(userId, otherUserId) {
  return db
    .prepare(
      `
      SELECT
        id,
        sender_id AS senderId,
        receiver_id AS receiverId,
        content,
        created_at AS createdAt
      FROM messages
      WHERE
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `,
    )
    .all(userId, otherUserId, otherUserId, userId);
}

// ======================================================
// BUSCA A LISTA DE CONVERSAS DO USUÁRIO
// ======================================================

function getConversations(userId) {
  return db
    .prepare(
      `
      SELECT
        u.id AS userId,
        u.name AS name,
        m.content AS lastMessage,
        m.created_at AS createdAt

      FROM users u

      INNER JOIN messages m
        ON m.id = (
          SELECT m2.id
          FROM messages m2
          WHERE
            (
              m2.sender_id = ?
              AND m2.receiver_id = u.id
            )
            OR
            (
              m2.sender_id = u.id
              AND m2.receiver_id = ?
            )
          ORDER BY m2.created_at DESC, m2.id DESC
          LIMIT 1
        )

      WHERE u.id != ?

      ORDER BY m.created_at DESC, m.id DESC
    `,
    )
    .all(userId, userId, userId);
}

// ======================================================
// APAGA O HISTÓRICO DE UMA CONVERSA
// ======================================================

function deleteConversation(userId, otherUserId) {
  const statement = db.prepare(`
    DELETE FROM messages
    WHERE
      (sender_id = ? AND receiver_id = ?)
      OR
      (sender_id = ? AND receiver_id = ?)
  `);

  const result = statement.run(userId, otherUserId, otherUserId, userId);

  return result.changes;
}

module.exports = {
  createMessage,
  getConversation,
  getConversations,
  deleteConversation,
};
