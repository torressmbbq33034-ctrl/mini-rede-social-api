const bcrypt = require("bcrypt");
const userModel = require("./user.model");

// Valida o formato básico do e-mail.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Identifica violações do índice único de e-mail.
function isDuplicateEmailError(error) {
  return (
    error.code === "SQLITE_CONSTRAINT_UNIQUE" &&
    error.message.includes("idx_users_email_unique")
  );
}

// Busca todos os usuários.
function getAll() {
  return userModel.findAll();
}

// Busca um usuário pelo ID.
function getById(id) {
  const user = userModel.findById(id);

  if (!user) {
    return null;
  }

  return user;
}

// Cria um usuário.
async function create(name, email, password) {
  if (!name || !email || !password) {
    return null;
  }

  if (!isValidEmail(email)) {
    return null;
  }

  // Padroniza o e-mail para letras minúsculas.
  const normalizedEmail = email.trim().toLowerCase();

  // Verifica se o e-mail já está cadastrado.
  const existingUser = userModel.findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("E-mail já cadastrado.");
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  // Criptografa a senha antes de salvar.
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // O banco também impede duplicidades simultâneas.
    return userModel.saveUser(name, normalizedEmail, hashedPassword);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      const conflictError = new Error("E-mail já cadastrado.");
      conflictError.code = "EMAIL_ALREADY_EXISTS";
      throw conflictError;
    }

    throw error;
  }
}

// Atualiza um usuário.
function update(id, name, email) {
  const user = userModel.findById(id);

  if (!user) {
    return null;
  }

  if (!name || !email || !isValidEmail(email)) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Verifica se o e-mail pertence a outro usuário.
  const existingUser = userModel.findUserByEmail(normalizedEmail);

  if (existingUser && existingUser.id !== id) {
    const error = new Error("E-mail já cadastrado.");
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  try {
    return userModel.updateUser(id, name, normalizedEmail);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      const conflictError = new Error("E-mail já cadastrado.");
      conflictError.code = "EMAIL_ALREADY_EXISTS";
      throw conflictError;
    }

    throw error;
  }
}

// Exclui um usuário pelo ID.
function deleteUserById(id) {
  const user = userModel.findById(id);

  if (!user) {
    return null;
  }

  return userModel.deleteUser(id);
}

// Exporta as funções do serviço.
module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteUserById,
};
