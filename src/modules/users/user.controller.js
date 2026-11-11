const userService = require("./user.service");

// Define quais dados do usuário podem ser enviados ao cliente.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

// Busca todos os usuários.
function getAllUsersController(req, res) {
  const users = userService.getAll();

  // Estudar o metodo map
  const usersPublic = users.map(publicUser);

  // o que é  res.json
  return res.json(usersPublic);
}

// Busca um usuário pelo ID.
function getUserByIdController(req, res) {
  const id = Number(req.params.id);

  const user = userService.getById(id);

  if (!user) {
    return res.status(404).json({
      message: "Usuário não encontrado",
    });
  }

  return res.json(publicUser(user));
}

// Cria um novo usuário.
async function createUserController(req, res) {
  // Verifica se o corpo da requisição existe e é válido.
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      message: "Corpo da requisição inválido ou ausente",
    });
  }

  const { name, email, password } = req.body;

  try {
    const user = await userService.create(name, email, password);

    if (!user) {
      return res.status(400).json({
        message: "Nome, email ou senha inválidos",
      });
    }

    return res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.code === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "E-mail já cadastrado.",
      });
    }

    console.error("Erro ao cadastrar usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar usuário",
    });
  }
}

// Atualiza nome e email do próprio usuário.
function updateUserByIdController(req, res) {
  const id = Number(req.params.id);

  // Verifica se existe usuário autenticado.
  if (!req.user) {
    return res.status(401).json({
      message: "Usuário não autenticado",
    });
  }

  // Impede alteração de outra conta.
  if (req.user.id !== id) {
    return res.status(403).json({
      message: "Você não pode alterar outro usuário",
    });
  }

  // Verifica se o corpo da requisição existe e é válido.
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      message: "Corpo da requisição inválido ou ausente",
    });
  }

  const { name, email } = req.body;

  try {
    const user = userService.update(id, name, email);

    if (!user) {
      return res.status(400).json({
        message: "Usuário não encontrado ou email inválido",
      });
    }

    return res.status(200).json({
      message: "Usuário atualizado",
    });
  } catch (error) {
    if (error.code === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "E-mail já cadastrado.",
      });
    }

    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar usuário",
    });
  }
}

// Exclui a conta do próprio usuário autenticado.
function deleteUserByIdController(req, res) {
  const id = Number(req.params.id);

  if (!req.user) {
    return res.status(401).json({
      message: "Usuário não autenticado",
    });
  }

  if (req.user.id !== id) {
    return res.status(403).json({
      message: "Você não pode excluir outro usuário",
    });
  }

  try {
    const user = userService.deleteUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      message: "Usuário deletado",
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao excluir usuário",
    });
  }
}

// Exporta as funções do controller.
module.exports = {
  createUserController,
  getUserByIdController,
  getAllUsersController,
  updateUserByIdController,
  deleteUserByIdController,
};
