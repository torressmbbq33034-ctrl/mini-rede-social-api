const bcrypt = require("bcrypt");

const userModel = require("../users/user.model");
const { jwt, JWT_SECRET } = require("../../config/jwt");

// Busca um usuário pelo e-mail.
function findUserByEmail(email) {
  return userModel.findUserByEmail(email);
}

// Realiza o login e valida as credenciais.
async function login(email, password) {
  // Verifica se os dados recebidos são válidos.
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return null;
  }

  const user = userModel.findUserByEmail(email);

  // Retorna login inválido se o usuário não existir.
  if (!user) {
    return null;
  }

  // Protege a comparação caso o hash esteja ausente ou inválido.
  if (typeof user.password !== "string" || !user.password.trim()) {
    return null;
  }

  let passwordCorrect;

  try {
    passwordCorrect = await bcrypt.compare(password, user.password);
  } catch (error) {
    return null;
  }

  // Retorna login inválido se a senha estiver incorreta.
  if (!passwordCorrect) {
    return null;
  }

  // Gera o token de autenticação.
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  return {
    user,
    token,
  };
}

module.exports = {
  findUserByEmail,
  login,
};
