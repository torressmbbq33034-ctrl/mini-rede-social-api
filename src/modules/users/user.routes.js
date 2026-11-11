//importaçoes
const express = require("express");
const user = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();
//rotas
router.get("/", user.getAllUsersController);

router.get("/:id", authMiddleware, user.getUserByIdController);

router.post("/", user.createUserController);

router.put("/:id", authMiddleware, user.updateUserByIdController);
router.delete("/:id", authMiddleware, user.deleteUserByIdController);
//Exportação

module.exports = router;
