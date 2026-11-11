const authService = require("./auth.service");

// Realiza o login do usuário.
async function login(req, res) {
  // Verifica se o corpo da requisição existe e é válido.
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      message: "Corpo da requisição inválido ou ausente",
    });
  }

  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({
        message: "Email ou senha inválidos",
      });
    }

    return res.status(200).json({
      id: result.user.id,
      name: result.user.name,
      token: result.token,
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return res.status(500).json({
      message: "Erro interno ao realizar login",
    });
  }
}

module.exports = {
  login,
};
