const { jwt, JWT_SECRET } = require("../config/jwt");

// Verifica se o usuário está autenticado.
function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  // Verifica se o token foi enviado no formato Bearer.
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token não informado ou formato inválido",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Token não informado ou formato inválido",
    });
  }

  try {
    // Verifica a assinatura e a validade do token.
    const decoded = jwt.verify(token, JWT_SECRET);

    // Confirma que o ID é um número inteiro válido.
    if (!Number.isInteger(decoded.id) || decoded.id <= 0) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    // Disponibiliza os dados do usuário para as rotas.
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }
}

module.exports = authMiddleware;
