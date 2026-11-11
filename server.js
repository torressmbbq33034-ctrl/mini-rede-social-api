const http = require("http");

const { Server } = require("socket.io");

const app = require("./src/app");

const messageService = require("./src/modules/messages/message.service");

const { jwt, JWT_SECRET } = require("./src/config/jwt");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ======================================================
// AUTENTICAÇÃO DO SOCKET.IO
// ======================================================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Token não informado"));
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== "object" || decoded === null || !("id" in decoded)) {
      return next(new Error("Token inválido"));
    }

    socket.userId = Number(decoded.id);

    next();
  } catch (error) {
    console.error("ERRO NO TOKEN DO SOCKET:", error.message);

    next(new Error("Token inválido ou expirado"));
  }
});

// ======================================================
// CONEXÃO SOCKET.IO
// ======================================================

io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);
  console.log("USER ID DO SOCKET:", socket.userId);

  // ====================================================
  // ENTRA NA SALA DO PRÓPRIO USUÁRIO
  // ====================================================

  const userRoom = `user_${socket.userId}`;

  socket.join(userRoom);

  console.log("Usuário entrou na sala:", userRoom);

  // ====================================================
  // TESTE PING
  // ====================================================

  socket.on("ping", () => {
    console.log("Recebi o evento ping");

    socket.emit("pong", {
      message: "Pong recebido pelo servidor!",
    });
  });

  // ====================================================
  // ENVIAR MENSAGEM
  // ====================================================

  socket.on("send_message", (data) => {
    try {
      const receiverId = Number(data.receiverId);
      const content = data.content;

      const message = messageService.createMessage(
        socket.userId,
        receiverId,
        content,
      );

      console.log("Mensagem criada:", message);

      // ==================================================
      // CONFIRMA PARA QUEM ENVIOU
      // ==================================================

      socket.emit("message_sent", message);

      // ==================================================
      // ENVIA SOMENTE PARA O DESTINATÁRIO
      // ==================================================

      const receiverRoom = `user_${receiverId}`;

      io.to(receiverRoom).emit("new_message", message);

      console.log("Mensagem enviada para a sala:", receiverRoom);
    } catch (error) {
      console.error("ERRO AO ENVIAR MENSAGEM:", error.message);

      socket.emit("message_error", {
        message: error.message,
      });
    }
  });

  // ====================================================
  // DESCONECTOU
  // ====================================================

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

server.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
