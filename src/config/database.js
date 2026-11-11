/* =====================================================
   CONFIGURAÇÃO DO BANCO DE DADOS
   ===================================================== */

const Database = require("better-sqlite3");
const path = require("node:path");

// Define o caminho do arquivo teste.db.
const dbPath = path.join(__dirname, "../../teste.db");

// Abre o banco de dados.
const db = new Database(dbPath);

// Ativa a verificação de chaves estrangeiras.
db.pragma("foreign_keys = ON");

// Cria a tabela USERS se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
  );
`);

// Verifica se a tabela USERS possui as colunas necessárias.
const columns = db.prepare("PRAGMA table_info(users)").all();

const hasPassword = columns.some((column) => column.name === "password");

const hasEmail = columns.some((column) => column.name === "email");

// Adiciona colunas caso estejam ausentes em bancos antigos.
if (!hasPassword) {
  db.exec("ALTER TABLE users ADD COLUMN password TEXT");
}

if (!hasEmail) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
}

// Atualiza as informações das colunas após possíveis alterações.
const updatedColumns = db.prepare("PRAGMA table_info(users)").all();

const emailColumn = updatedColumns.find((column) => column.name === "email");

const passwordColumn = updatedColumns.find(
  (column) => column.name === "password",
);

// Verifica se existem usuários com dados incompletos.
const incompleteUsers = db
  .prepare(
    `
  SELECT id, name
  FROM users
  WHERE email IS NULL
     OR TRIM(email) = ''
     OR password IS NULL
     OR TRIM(password) = ''
`,
  )
  .all();

// Impede a migração caso existam registros incompletos.
if (incompleteUsers.length > 0) {
  throw new Error(
    "Existem usuários sem e-mail ou senha. " +
      "Corrija esses registros antes da migração: " +
      incompleteUsers.map((user) => user.id).join(", "),
  );
}

// Migra a tabela para tornar e-mail e senha obrigatórios.
if (emailColumn.notnull !== 1 || passwordColumn.notnull !== 1) {
  // Desativa temporariamente as chaves estrangeiras.
  db.pragma("foreign_keys = OFF");

  try {
    const migrateUsers = db.transaction(() => {
      // Cria a nova tabela com as colunas obrigatórias.
      db.exec(`
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL
        );
      `);

      // Copia os usuários preservando seus IDs.
      db.exec(`
        INSERT INTO users_new (id, name, email, password)
        SELECT id, name, email, password
        FROM users;
      `);

      // Substitui a tabela antiga pela nova.
      db.exec(`
        DROP TABLE users;

        ALTER TABLE users_new RENAME TO users;
      `);
    });

    migrateUsers();
  } finally {
    // Reativa a verificação de chaves estrangeiras.
    db.pragma("foreign_keys = ON");
  }
}

// Impede e-mails duplicados, ignorando maiúsculas e minúsculas.
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users(LOWER(email))
  WHERE email IS NOT NULL;
`);

// Cria a tabela POSTS se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Cria a tabela FRIENDSHIPS se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (addressee_id) REFERENCES users(id)
  );
`);

// Cria a tabela LIKES se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE (user_id, post_id)
  );
`);

// Cria a tabela COMMENTS se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );
`);

// Cria a tabela MESSAGES se ela não existir.
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );
`);

// Cria índices para melhorar as consultas.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_likes_post_id
  ON likes(post_id);

  CREATE INDEX IF NOT EXISTS idx_likes_user_id
  ON likes(user_id);

  CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON comments(post_id);
`);

// Exporta a conexão com o banco.
module.exports = db;
