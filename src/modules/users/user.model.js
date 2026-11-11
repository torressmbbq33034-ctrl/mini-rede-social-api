const db = require("../../config/database");

// =====================================================
// Busca todos os usuários
// =====================================================
//
// O SELECT * significa:
// "selecione todas as colunas"
//
// O .all() retorna todos os registros encontrados.
//
function findAll() {
  const users = db.prepare("SELECT * FROM users").all();

  return users;
}

// =====================================================
// Busca um usuário pelo ID
// =====================================================
//
// O ? é um espaço reservado para o valor do ID.
//
// Exemplo:
// SELECT * FROM users WHERE id = 5
//
// Mas não colocamos o 5 diretamente no SQL.
// Usamos:
// WHERE id = ?
//
// E depois passamos o ID no .get(id).
//
function findById(id) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  return user;
}

// =====================================================
// Salva um novo usuário
// =====================================================

function saveUser(name, email, password) {
  // Prepara o comando SQL de INSERT.
  //
  // Os ? serão substituídos pelos valores
  // que passaremos no .run().
  //
  const newUser = db.prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
  );

  // Executa o INSERT.
  //
  // Aqui o banco recebe:
  // name
  // email
  // password
  //
  const info = newUser.run(name, email, password);

  // Depois de inserir o usuário,
  // precisamos buscar esse usuário pelo ID
  // que o banco acabou de criar.
  //
  // lastInsertRowid contém o ID gerado pelo SQLite.
  //
  const user = findById(info.lastInsertRowid);

  // Retornamos o usuário completo.
  return user;
}

// =====================================================
// Atualiza o nome de um usuário
// =====================================================

function updateUser(id, name, email) {
  // Prepara o comando UPDATE.
  //
  // Vamos alterar o nome do usuário
  // que possui determinado ID.
  //
  const update = db.prepare(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
  );

  // Executa o UPDATE.
  const info = update.run(name, email, id);

  return info;
}

// =====================================================
// Exclui um usuário
// =====================================================

function deleteUser(id) {
  // Executa todas as exclusões como uma única operação.
  const deleteTransaction = db.transaction(() => {
    // Exclui curtidas feitas pelo usuário ou em suas publicações.
    db.prepare(
      `
      DELETE FROM likes
      WHERE user_id = ?
         OR post_id IN (
           SELECT id FROM posts WHERE user_id = ?
         )
    `,
    ).run(id, id);

    // Exclui comentários escritos pelo usuário ou em suas publicações.
    db.prepare(
      `
      DELETE FROM comments
      WHERE user_id = ?
         OR post_id IN (
           SELECT id FROM posts WHERE user_id = ?
         )
    `,
    ).run(id, id);

    // Exclui mensagens enviadas ou recebidas pelo usuário.
    db.prepare(
      `
      DELETE FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `,
    ).run(id, id);

    // Exclui amizades das quais o usuário participa.
    db.prepare(
      `
      DELETE FROM friendships
      WHERE requester_id = ? OR addressee_id = ?
    `,
    ).run(id, id);

    // Exclui as publicações do usuário.
    db.prepare("DELETE FROM posts WHERE user_id = ?").run(id);

    // Por último, exclui a conta.
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);

    return result;
  });

  // Confirma tudo somente se todas as operações funcionarem.
  return deleteTransaction();
}

// =====================================================
// Busca usuário pelo nome
// =====================================================
//
// Essa função procura um usuário pelo nome.
//
// IMPORTANTE:
// .get() retorna apenas UM usuário.
//
// Se existirem duas pessoas chamadas Lucas,
// essa função não garante que encontraremos
// a pessoa correta.
//
function findUserByname(name) {
  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name);

  return user;
}

// =====================================================
// Busca usuário pelo email
// =====================================================
//
// O email normalmente é uma informação mais adequada
// para identificar o usuário do que o nome.
//
// Exemplo:
// lucas@gmail.com
//
// O banco procura exatamente esse email.
//

function findUserByEmail(email) {
  const user = db
    .prepare(
      `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER(?)
  `,
    )
    .get(email.trim());

  return user;
}

// =====================================================
// Exporta as funções
// =====================================================
//
// Dessa forma, o service consegue utilizar
// as funções deste arquivo.
//
// Exemplo:
//
// userModel.findById(id)
// userModel.saveUser(...)
// userModel.findUserByEmail(email)
//

module.exports = {
  findAll,
  findById,
  saveUser,
  updateUser,
  deleteUser,
  findUserByname,
  findUserByEmail,
};
