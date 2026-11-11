// CONEXÃO COM O BANCO DE DADOS
const db = require("../../config/database");

// CRIA UM NOVO PEDIDO DE AMIZADE
function createFriendship(requesterId, addresseeId) {
  const result = db
    .prepare(
      `
      INSERT INTO friendships (requester_id, addressee_id)
      VALUES (?, ?)
    `,
    )
    .run(requesterId, addresseeId);

  return {
    id: result.lastInsertRowid,
    requesterId,
    addresseeId,
    status: "pending",
  };
}

// PROCURA UMA AMIZADE ENTRE DOIS USUÁRIOS
function findFriendship(userId, otherUserId) {
  const friendship = db
    .prepare(
      `
      SELECT *
      FROM friendships
      WHERE
        (requester_id = ? AND addressee_id = ?)
        OR
        (requester_id = ? AND addressee_id = ?)
    `,
    )
    .get(userId, otherUserId, otherUserId, userId);

  return friendship;
}

// BUSCA OS PEDIDOS DE AMIZADE RECEBIDOS
function getPendingRequests(userId) {
  const requests = db
    .prepare(
      `
      SELECT
        friendships.id,
        friendships.requester_id AS requesterId,
        friendships.addressee_id AS addresseeId,
        friendships.status,
        users.name AS requesterName,
        users.email AS requesterEmail
      FROM friendships
      INNER JOIN users
        ON users.id = friendships.requester_id
      WHERE friendships.addressee_id = ?
        AND friendships.status = 'pending'
    `,
    )
    .all(userId);

  return requests;
}

// ACEITA UM PEDIDO DE AMIZADE
function acceptFriendship(friendshipId, userId) {
  const result = db
    .prepare(
      `
      UPDATE friendships
      SET status = 'accepted'
      WHERE id = ?
        AND addressee_id = ?
        AND status = 'pending'
    `,
    )
    .run(friendshipId, userId);

  if (result.changes === 0) {
    return null;
  }

  const friendship = db
    .prepare(
      `
      SELECT
        id,
        requester_id AS requesterId,
        addressee_id AS addresseeId,
        status
      FROM friendships
      WHERE id = ?
    `,
    )
    .get(friendshipId);

  return friendship;
}

// RECUSA UM PEDIDO DE AMIZADE
function rejectFriendship(friendshipId, userId) {
  const result = db
    .prepare(
      `
      DELETE FROM friendships
      WHERE id = ?
        AND addressee_id = ?
        AND status = 'pending'
      `,
    )
    .run(friendshipId, userId);

  if (result.changes === 0) {
    return null;
  }

  return {
    id: friendshipId,
    status: "rejected",
  };
}

// BUSCA AS AMIZADES ACEITAS DO USUÁRIO
function getFriends(userId) {
  const friends = db
    .prepare(
      `
      SELECT
        friendships.id AS friendshipId,

        CASE
          WHEN friendships.requester_id = ?
          THEN friendships.addressee_id
          ELSE friendships.requester_id
        END AS userId,

        users.name,
        users.email

      FROM friendships

      INNER JOIN users
        ON users.id = CASE
          WHEN friendships.requester_id = ?
          THEN friendships.addressee_id
          ELSE friendships.requester_id
        END

      WHERE
        (
          friendships.requester_id = ?
          OR friendships.addressee_id = ?
        )
        AND friendships.status = 'accepted'
      `,
    )
    .all(userId, userId, userId, userId);

  return friends;
}

// REMOVE UMA AMIZADE
function removeFriendship(friendshipId, userId) {
  const result = db
    .prepare(
      `
      DELETE FROM friendships
      WHERE id = ?
        AND status = 'accepted'
        AND (
          requester_id = ?
          OR addressee_id = ?
        )
      `,
    )
    .run(friendshipId, userId, userId);

  if (result.changes === 0) {
    return null;
  }

  return {
    id: friendshipId,
    status: "removed",
  };
}

// VERIFICA SE DOIS USUÁRIOS SÃO AMIGOS
function areFriends(userId, otherUserId) {
  const friendship = db
    .prepare(
      `
      SELECT id
      FROM friendships
      WHERE
        (
          (requester_id = ? AND addressee_id = ?)
          OR
          (requester_id = ? AND addressee_id = ?)
        )
        AND status = 'accepted'
      `,
    )
    .get(userId, otherUserId, otherUserId, userId);

  return friendship;
}

// VERIFICA O STATUS DA RELAÇÃO ENTRE DOIS USUÁRIOS
function getFriendshipStatus(userId, otherUserId) {
  const friendship = db
    .prepare(
      `
      SELECT
        id,
        requester_id AS requesterId,
        addressee_id AS addresseeId,
        status
      FROM friendships
      WHERE
        (requester_id = ? AND addressee_id = ?)
        OR
        (requester_id = ? AND addressee_id = ?)
    `,
    )
    .get(userId, otherUserId, otherUserId, userId);

  if (!friendship) {
    return {
      status: "none",
    };
  }

  return {
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
  };
}

module.exports = {
  createFriendship,
  findFriendship,
  getPendingRequests,
  acceptFriendship,
  rejectFriendship,
  getFriends,
  removeFriendship,
  areFriends,
  getFriendshipStatus,
};
