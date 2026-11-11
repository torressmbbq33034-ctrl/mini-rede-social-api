// IMPORTA O EXPRESS
const express = require("express");

// IMPORTA O CORS
const cors = require("cors");

// IMPORTA AS ROTAS DE USUÁRIOS
const userRoutes = require("./modules/users/user.routes");

// IMPORTA AS ROTAS DE POSTS
const postRoutes = require("./modules/posts/post.routes");

// IMPORTA AS ROTAS DE AUTENTICAÇÃO
const authRoutes = require("./modules/auth/auth.routes");

// IMPORTA AS ROTAS DE AMIZADES
const friendshipRoutes = require("./modules/friendships/friendship.routes");

// IMPORTA AS ROTAS DE LIKES
const likesRoutes = require("./modules/likes/likes.routes");

// IMPORTA AS ROTAS DE COMENTÁRIOS
const commentRoutes = require("./modules/comments/comment.routes");

// IMPORTA AS ROTAS DE MENSAGENS
const messageRoutes = require("./modules/messages/message.routes");

// INICIALIZA O BANCO DE DADOS
require("./config/database");

// CRIA A APLICAÇÃO EXPRESS
const app = express();

// PERMITE REQUISIÇÕES DE OUTROS DOMÍNIOS
app.use(cors());

// PERMITE RECEBER JSON NAS REQUISIÇÕES
app.use(express.json());

// MOSTRA NO TERMINAL AS REQUISIÇÕES RECEBIDAS
app.use((req, res, next) => {
  console.log("REQUISIÇÃO:", req.method, req.url);
  next();
});

// REGISTRA AS ROTAS DE USUÁRIOS
app.use("/users", userRoutes);

// REGISTRA AS ROTAS DE POSTS
app.use("/", postRoutes);

// REGISTRA AS ROTAS DE AUTENTICAÇÃO
app.use("/auth", authRoutes);

// REGISTRA AS ROTAS DE AMIZADES
app.use("/", friendshipRoutes);

// REGISTRA AS ROTAS DE LIKES
app.use(likesRoutes);

// REGISTRA AS ROTAS DE COMENTÁRIOS
app.use(commentRoutes);

// REGISTRA AS ROTAS DE MENSAGENS
app.use(messageRoutes);

// EXPORTA A APLICAÇÃO
module.exports = app;
