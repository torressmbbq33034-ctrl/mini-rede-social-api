# Levantamento de melhorias: validação, código repetido e bugs

Este documento lista os pontos do projeto que precisam ser corrigidos. Ele **não traz a solução pronta** de propósito: a ideia é você entender o problema, pesquisar e chegar à resposta. Quando fizer sentido, deixei um termo em **Pesquise:** para te dar um norte.

Escopo deste levantamento:

- **Validação**: dados que entram na aplicação sem serem conferidos.
- **Código repetido**: a mesma lógica escrita em vários lugares.
- **Código errado / bug**: comportamento diferente do esperado.

Ficaram de fora, de propósito, **performance** e **segurança** (segredo do JWT, CORS, rate limit, etc.). Eles serão tratados em outra frente.

## Como ler cada item

Cada item segue o mesmo formato:

- **Onde**: arquivo, linha e função/método.
- **Como está**: o que o código faz hoje.
- **Problema**: o que pode dar errado se continuar assim.
- **O que fazer**: o objetivo da correção (não o código).

Prioridade:

- **Alta**: quebra a aplicação, corrompe dados ou faz uma funcionalidade não funcionar.
- **Média**: comportamento errado ou inconsistente, mas que não derruba nada.
- **Baixa**: organização, clareza e limpeza.

Sugestão de ordem: leia a Parte 1 (Zod), corrija a Parte 2 (bugs), depois a Parte 3 (validações), e só então a Parte 4 (repetição) e a Parte 5 (limpeza).

---

## Parte 1: uma aula rápida de Zod

### O que é

Zod é uma biblioteca de **validação de dados em tempo de execução**. Você descreve o formato que um dado deve ter (isso se chama **schema**) e o Zod confere se o dado recebido segue esse formato. Se não seguir, ele te diz exatamente qual campo está errado e por quê.

### Por que usar

JavaScript não confere tipos. Se o front-end mandar `{ "content": 123 }` no lugar de um texto, nada impede esse valor de chegar até o banco. Hoje o projeto tenta se proteger com vários `if` espalhados, e isso gera três problemas que você vai ver neste documento:

1. **Validação incompleta**: alguns campos são conferidos, outros não.
2. **Validação repetida**: o mesmo `if` aparece em vários arquivos.
3. **Validação inconsistente**: o mesmo dado é validado de um jeito em um arquivo e de outro jeito em outro.

Com o Zod, a regra de cada dado fica escrita **em um lugar só**, e todo mundo usa a mesma regra.

Outra vantagem: o Zod também gera **tipos**. Mesmo continuando em JavaScript, você consegue usar esses tipos com comentários JSDoc para o editor (VS Code) te avisar quando você usa um campo errado. Quando o projeto for migrado para TypeScript, os schemas são reaproveitados sem mudança.

### Conceitos principais

- **Schema**: a "receita" do dado. Ex.: "um objeto com `nome` texto obrigatório e `preco` número positivo".
- **`parse`**: valida e, se o dado for inválido, **lança um erro**.
- **`safeParse`**: valida e **devolve um objeto** dizendo se deu certo (`success`), com os dados limpos (`data`) ou com o erro (`error`). Não lança exceção.
- **Coerção (`coerce`)**: converte o valor antes de validar. Útil porque tudo que vem da URL (`req.params`) chega como **texto**, mesmo quando é um número.
- **Transformações**: além de validar, o schema pode limpar o dado (tirar espaços, deixar minúsculo, etc.). O dado que sai do `safeParse` já vem tratado.
- **Erros estruturados**: o erro do Zod diz qual campo falhou e qual regra quebrou. Isso permite devolver para o cliente uma mensagem por campo, e não um genérico "dados inválidos".
- **`z.infer`**: extrai o tipo a partir do schema.

### Exemplo genérico (fora do domínio do projeto)

Instalação: `npm install zod`. A versão atual é a 4. Cuidado com tutoriais antigos: na versão 3 o e-mail era validado com `z.string().email()`; na 4 o formato recomendado é `z.email()`. Use sempre a documentação oficial: https://zod.dev

```js
const { z } = require("zod");

// Schema: a "receita" de um produto de uma loja
const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  preco: z.number().positive("Preço deve ser maior que zero"),
  emEstoque: z.boolean().default(true),
});

const resultado = produtoSchema.safeParse({ nome: "   ", preco: -5 });

if (!resultado.success) {
  // Mostra os erros organizados por campo
  console.log(z.flattenError(resultado.error));
} else {
  // Dados já validados e limpos (o "nome" já vem sem espaços nas pontas)
  console.log(resultado.data);
}
```

Tipagem em JavaScript usando o schema (o editor passa a autocompletar e avisar erros):

```js
// @ts-check
/** @typedef {import("zod").infer<typeof produtoSchema>} Produto */

/**
 * @param {Produto} produto
 */
function exibirProduto(produto) {
  // o editor sabe que produto.nome é string e produto.preco é number
}
```

**Pesquise:** `jsconfig.json` com `checkJs`, para o VS Code conferir os tipos do projeto inteiro.

### Onde o Zod entra neste projeto

Pense em validação como a **portaria** da aplicação: tudo que vem de fora é conferido na entrada, e o restante do código (service, model) recebe dados que já são confiáveis. As "portas de entrada" deste projeto são:

- `req.body` (corpo das requisições);
- `req.params` (IDs na URL);
- o payload dos eventos do Socket.IO (`send_message`);
- o conteúdo do token JWT depois de decodificado.

Um ponto importante: **o Zod não substitui as regras do banco**. Ele confere o *formato* do dado ("isso é um e-mail válido?"), mas não sabe se o e-mail já está cadastrado. Regras como unicidade precisam existir também no banco de dados.

**Pesquise:** "validation middleware express zod".

---

## Parte 2: bugs e código errado

### B-01. O banco não cria a tabela `users` (Alta)

- **Onde:** `src/config/database.js:7-21` (inicialização do banco).
- **Como está:** O código lê as colunas da tabela `users` (`PRAGMA table_info`) e roda `ALTER TABLE` para adicionar `password` e `email`. Em nenhum lugar do projeto existe um `CREATE TABLE users`.
- **Problema:** O projeto só funciona porque o arquivo `teste.db` já veio com a tabela criada. Se alguém clonar o projeto sem esse arquivo, ou se o banco for apagado, a aplicação quebra ao iniciar com o erro `no such table: users`.
- **O que fazer:** Garantir que o próprio código crie **todas** as tabelas, incluindo `users`, já com todas as colunas e regras desde o início, em vez de remendar a tabela com `ALTER TABLE`. **Pesquise:** "database migrations".

### B-02. O caminho do banco depende de onde o comando foi executado (Média)

- **Onde:** `src/config/database.js:4`.
- **Como está:** `new Database("teste.db")` usa um caminho relativo.
- **Problema:** Caminho relativo é resolvido a partir da pasta onde o terminal está, não da pasta do arquivo. Se você rodar o servidor a partir de outra pasta, um banco novo e vazio é criado nesse outro lugar, e a aplicação quebra por causa do B-01.
- **O que fazer:** O caminho do banco deve ser fixo e independente da pasta de execução (de preferência configurável). **Pesquise:** `__dirname` e `path.join` no Node.

### B-03. As chaves estrangeiras não são respeitadas pelo banco (Alta)

- **Onde:** `src/config/database.js` (todo o arquivo). Efeitos em `src/modules/users/user.model.js:98` (`deleteUser`) e `src/modules/friendships/friendship.service.js:5` (`sendRequest`).
- **Como está:** As tabelas declaram `FOREIGN KEY`, mas o SQLite vem com a checagem de chaves estrangeiras **desligada** por padrão, e o projeto nunca a liga.
- **Problema:** Na prática as `FOREIGN KEY` não fazem nada. Exemplos reais:
  - É possível enviar pedido de amizade para um usuário que não existe (`POST /friendships/99999`): o pedido é salvo.
  - Ao apagar um usuário, os posts, likes, comentários, amizades e mensagens dele continuam no banco apontando para um usuário que não existe mais (dados "órfãos").
- **O que fazer:** Ligar a checagem de chaves estrangeiras no SQLite e decidir o que acontece com os dados relacionados quando um usuário é apagado. Além disso, o `sendRequest` deve conferir se o usuário destinatário existe antes de criar o pedido. **Pesquise:** "sqlite foreign_keys pragma" e "ON DELETE CASCADE".

### B-04. E-mail sem garantia de unicidade (Alta)

- **Onde:** `src/config/database.js:20`; `src/modules/users/user.service.js:52` (`create`); `src/modules/users/user.service.js:98` (`update`); `src/modules/auth/auth.service.js:11` (`login`).
- **Como está:** A coluna `email` é um `TEXT` simples. O `create` e o `update` não verificam se o e-mail já pertence a outro usuário.
- **Problema:** Dois usuários podem ter o mesmo e-mail. No login, `findUserByEmail` usa `.get()`, que devolve **só o primeiro** registro encontrado. Resultado: a segunda pessoa nunca consegue logar, ou pior, as senhas se misturam e alguém entra na conta errada.
  Atenção a um detalhe: no `create` existe um `await bcrypt.hash(...)`. Enquanto o hash é calculado, outra requisição pode ser atendida. Ou seja, mesmo que você adicione um "já existe esse e-mail?" no código, duas requisições simultâneas podem passar pela verificação ao mesmo tempo. Por isso a verificação no código **não basta sozinha**.
- **O que fazer:** Garantir a unicidade do e-mail **no banco** e também **no código** (para devolver uma mensagem amigável, como "e-mail já cadastrado", com o status HTTP correto). Vale tanto para criar quanto para atualizar. **Pesquise:** "unique constraint sqlite" e "HTTP 409 Conflict".

### B-05. Usuários sem e-mail ou sem senha no banco derrubam o login (Alta)

- **Onde:** `src/config/database.js:15` e `:20`; `src/modules/auth/auth.service.js:17` (`login`).
- **Como está:** As colunas `password` e `email` foram adicionadas sem serem obrigatórias. No `teste.db` atual existem **7 usuários: 4 sem e-mail e 1 sem senha**.
- **Problema:** Usuários sem e-mail nunca conseguem logar. No usuário sem senha, o `bcrypt.compare(password, user.password)` recebe `null` como hash e **lança um erro**, que vira um erro 500 em vez de um "e-mail ou senha inválidos".
- **O que fazer:** Tornar `email` e `password` obrigatórios no banco e decidir o que fazer com os registros antigos que estão incompletos (corrigir ou remover).

### B-06. A rota de excluir usuário nunca funciona (Alta)

- **Onde:** `src/modules/users/user.routes.js:15`; `src/modules/users/user.controller.js:105` (`deleteUserByIdController`).
- **Como está:** A rota `DELETE /users/:id` não usa o `authMiddleware`. O controller verifica `if (!req.user)`.
- **Problema:** Quem preenche o `req.user` é o `authMiddleware`. Sem ele, `req.user` é sempre `undefined`, então essa rota **sempre** responde 401. A exclusão de usuário simplesmente não funciona.
- **O que fazer:** Conferir que toda rota que depende do usuário logado passa pelo middleware de autenticação. Compare com a rota `PUT /users/:id` da linha 14, que está correta.

### B-07. Requisição sem corpo derruba vários endpoints com erro 500 (Alta)

- **Onde:**
  - `src/modules/users/user.controller.js:45` (`createUserController`) e `:67` (`updateUserByIdController`);
  - `src/modules/auth/auth.controller.js:4` (`login`);
  - `src/modules/posts/post.controller.js:10` (`createPost`) e `:65` (`updatePosts`);
  - `src/modules/comments/comment.controller.js:13` (`createComment`) e `:74` (`updateComment`).
- **Como está:** Todos fazem algo como `const { email, password } = req.body` ou `req.body.content`.
- **Problema:** O projeto usa Express 5. Nessa versão, quando a requisição chega sem corpo ou sem o cabeçalho `Content-Type: application/json`, o `req.body` fica `undefined` (no Express 4 ele virava `{}`). Tentar ler uma propriedade de `undefined` lança `TypeError`, e o cliente recebe um erro 500 em HTML em vez de um 400 explicando o que faltou.
- **O que fazer:** Validar o corpo da requisição antes de usá-lo e responder 400 quando ele estiver ausente ou inválido. Esse é exatamente o tipo de problema que um schema do Zod resolve na entrada. **Pesquise:** "Express 5 migration req.body".

### B-08. Enviar um conteúdo que não é texto gera erro 500 (Média)

- **Onde:** `src/modules/posts/post.controller.js:12` (`createPost`) e `:73` (`updatePosts`); `src/modules/comments/comment.service.js:19` (`createComment`) e `:72` (`updateComment`).
- **Como está:** O código faz `content.trim()` depois de checar apenas se `content` existe.
- **Problema:** Se o cliente mandar `{ "content": 123 }` ou `{ "content": ["oi"] }`, o valor existe, mas não é texto. O `.trim()` não existe em número nem em array, o código lança erro e o cliente recebe 500 em vez de 400.
- **O que fazer:** Conferir o **tipo** do dado, não só se ele existe.

### B-09. Login sem e-mail ou sem senha gera erro 500 (Média)

- **Onde:** `src/modules/auth/auth.controller.js:4` (`login`); `src/modules/auth/auth.service.js:10` (`login`).
- **Como está:** O e-mail e a senha vão direto para o service, sem nenhuma conferência.
- **Problema:** Se a senha vier vazia ou ausente, o `bcrypt.compare` lança erro (ele exige os dois argumentos) e a resposta é 500 em vez de 400/401.
- **O que fazer:** Validar a entrada do login (presença, tipo e formato) antes de chamar o service.

### B-10. Atualizar usuário sem enviar o nome quebra a requisição (Média)

- **Onde:** `src/modules/users/user.service.js:98` (`update`); `src/modules/users/user.model.js:78` (`updateUser`).
- **Como está:** O `update` valida só o e-mail. O nome vai direto para o `UPDATE`.
- **Problema:** A coluna `name` é `NOT NULL`. Se o cliente enviar só o e-mail, o banco recusa o `UPDATE` com erro e a resposta é 500. Um nome feito só de espaços (`"   "`) também é aceito.
- **O que fazer:** Validar todos os campos que vão ser gravados, não só alguns. Decidir também se a atualização exige todos os campos ou permite atualizar só um (isso muda a regra de validação). **Pesquise:** "PUT vs PATCH".

### B-11. A rota de criar post ignora o ID da URL (Média)

- **Onde:** `src/modules/posts/post.routes.js:13`; `src/modules/posts/post.controller.js:9` (`createPost`).
- **Como está:** A rota é `POST /users/:id/posts`, mas o controller usa `req.user.id` e ignora `req.params.id`.
- **Problema:** `POST /users/999/posts` cria o post para o usuário logado, não para o 999. A URL "mente" sobre o que acontece, e quem consome a API pode achar que está postando em nome de outra pessoa (ou que deveria poder).
- **O que fazer:** A URL deve refletir a operação. Ou o ID da URL é validado contra o usuário logado, ou ele não deveria existir nessa rota.

### B-12. Status HTTP errados nas respostas de erro (Média)

- **Onde:**
  - `src/modules/comments/comment.controller.js:21`, `:78` e `:106`: todo erro vira **400**, inclusive "Comentário não encontrado" (deveria ser 404) e "Você não pode editar este comentário" (deveria ser 403).
  - `src/modules/friendships/friendship.controller.js`: todos os `catch` (linhas 17, 32, 51, 70, 85, 104, 120) devolvem **400**, inclusive "Pedido não encontrado" e erros inesperados do banco.
  - `src/modules/posts/post.controller.js:51` (`getPostsByUser`): **qualquer** erro vira **403**, até um erro do banco.
  - `src/modules/messages/message.controller.js:16` (`getConversation`): **qualquer** erro vira **403**, inclusive "você não pode abrir uma conversa consigo mesmo" (que é um 400).
  - `src/modules/users/user.controller.js:89` (`updateUserByIdController`): "não encontrado" e "e-mail inválido" viram o mesmo 400.
- **Problema:** O status HTTP é como o front-end decide o que fazer (mostrar "não encontrado", pedir login de novo, mostrar erro de formulário). Status errado leva o front-end a reagir errado, e erros reais do servidor ficam escondidos como se fossem culpa do usuário.
- **O que fazer:** Cada tipo de erro deve ter o seu status correto, e erros inesperados devem virar 500. Isso fica muito mais fácil depois de resolver o D-01. **Pesquise:** "HTTP status codes 400 401 403 404 409 500".

### B-13. Ordem de mensagens e comentários pode sair trocada (Média)

- **Onde:** `src/modules/messages/message.model.js:50` (`getConversation`); `src/modules/comments/comment.model.js:36` (`getCommentsByPost`).
- **Como está:** A ordenação usa só `ORDER BY created_at`.
- **Problema:** `CURRENT_TIMESTAMP` do SQLite tem precisão de **segundos**. Duas mensagens enviadas no mesmo segundo ficam "empatadas" e o banco pode devolvê-las em qualquer ordem. Numa conversa isso aparece como mensagens fora de ordem.
  Repare que em `src/modules/messages/message.model.js:86` (`getConversations`) você já resolveu esse empate de outra forma. A mesma ideia não foi aplicada nos outros dois lugares.
- **O que fazer:** Garantir uma ordenação sem empate nas listagens.

### B-14. Regras de visibilidade de posts não valem para likes e comentários (Média)

- **Onde:** Regra em `src/modules/posts/post.service.js:24` (`getPostsByUser`). Ausente em `src/modules/likes/likes.service.js:4` (`createLike`), `:61` (`countLikes`), `:79` (`findUsersWhoLikedPost`) e em `src/modules/comments/comment.service.js:17` (`createComment`) e `:47` (`getCommentsByPost`).
- **Como está:** Para ver os posts de alguém, é preciso ser amigo. Para curtir, comentar, ler comentários e ver quem curtiu, basta saber o ID do post.
- **Problema:** A regra de negócio fica incoerente: um usuário não pode ver um post, mas pode curtir e comentar nele.
- **O que fazer:** Definir a regra de quem pode interagir com um post e aplicá-la de forma igual em todas as operações sobre posts.

### B-15. Buscar posts de um usuário que não existe devolve 403 (Baixa)

- **Onde:** `src/modules/posts/post.service.js:17` (`getPostsByUser`).
- **Como está:** O código só verifica amizade.
- **Problema:** Para um usuário inexistente, a resposta é "você só pode visualizar posts de amigos" (403), quando o correto seria "usuário não encontrado" (404). Isso confunde quem está depurando o front-end.
- **O que fazer:** Verificar se o usuário alvo existe antes de aplicar a regra de amizade.

### B-16. Apagar uma conversa apaga também para a outra pessoa (regra a confirmar)

- **Onde:** `src/modules/messages/message.model.js:102` (`deleteConversation`).
- **Como está:** O `DELETE` remove as mensagens dos dois lados da conversa.
- **Problema:** Se o usuário A "apaga a conversa", o usuário B perde o histórico também, sem ter pedido nada. Pode ser intencional, mas normalmente não é o comportamento esperado de um chat.
- **O que fazer:** Confirmar a regra de negócio. Se apagar for só "para mim", o modelo de dados atual não suporta isso.

---

## Parte 3: validações ausentes ou incompletas

### V-01. IDs da URL não são validados na maioria dos endpoints (Alta)

- **Onde (sem nenhuma validação):**
  - `src/modules/users/user.controller.js:27`, `:64`, `:102`;
  - `src/modules/friendships/friendship.controller.js:8`, `:41`, `:60`, `:94`, `:114`;
  - `src/modules/comments/comment.controller.js:15`, `:70`, `:100`;
  - `src/modules/messages/message.controller.js:10`, `:47`;
  - `server.js:83` (evento `send_message`).
- **Onde (validação incompleta):** `src/modules/posts/post.controller.js:39`, `:67`, `:112` checam se é inteiro, mas aceitam `0` e números negativos. Já `src/modules/likes/likes.controller.js` checa as duas coisas. O mesmo dado é validado de dois jeitos diferentes.
- **Como está:** `Number(req.params.id)` é usado direto.
- **Problema:** `Number("abc")` vira `NaN`, e esse `NaN` segue para o service e para o banco. O resultado é imprevisível: mensagens erradas (ex.: enviar mensagem para `receiverId: "abc"` responde "você só pode enviar mensagens para amigos"), erros internos do SQLite vazando para o cliente, ou status HTTP errado.
- **O que fazer:** Validar todo ID que vem da URL ou do socket com **uma única regra** (inteiro, positivo), aplicada em todos os endpoints. Este é um bom primeiro uso do Zod (lembre do conceito de coerção da Parte 1).

### V-02. Cadastro de usuário com validação fraca (Alta)

- **Onde:** `src/modules/users/user.service.js:52` (`create`) e `:20` (`isValidEmail`).
- **Como está:** Só verifica se os campos existem e se o e-mail bate com uma regex simples.
- **Problema:**
  - **Nome:** `"   "` (só espaços) é aceito. Não há tamanho mínimo nem máximo.
  - **Senha:** `"1"` é aceita. Não há tamanho mínimo. Também não há tamanho máximo, e o bcrypt só considera os primeiros 72 bytes da senha (o resto é ignorado sem aviso).
  - **E-mail:** não é normalizado. `Lucas@Gmail.com` e `lucas@gmail.com` viram contas diferentes, e o login com letras maiúsculas diferentes do cadastro falha.
  - **Tipos:** se `name` vier como número ou objeto, passa pelo `if (!name)` e vai para o banco.
- **O que fazer:** Definir as regras de cada campo (tipo, tamanho mínimo/máximo, formato, normalização) e aplicá-las no cadastro, na atualização e no login, sempre as mesmas. **Pesquise:** "bcrypt 72 bytes limit".

### V-03. Erros de validação sem detalhe para o cliente (Média)

- **Onde:** `src/modules/users/user.service.js:60-73` (`create`); `src/modules/users/user.controller.js:51-55` (`createUserController`).
- **Como está:** Qualquer falha de validação devolve `null`, e o controller responde "Nome, email ou senha inválidos".
- **Problema:** O usuário não sabe **qual** campo está errado. O front-end não consegue destacar o campo com problema no formulário.
- **O que fazer:** A resposta de erro de validação deve dizer qual campo falhou e por quê. O Zod já entrega isso pronto (Parte 1, "erros estruturados").

### V-04. Conteúdo de mensagens sem nenhuma validação (Alta)

- **Onde:** `server.js:81-90` (evento `send_message`); `src/modules/messages/message.service.js:8` (`createMessage`).
- **Como está:** `data.content` vai direto para o banco.
- **Problema:**
  - Mensagem vazia (`""`) é aceita e salva.
  - Se o cliente emitir o evento sem payload, `data.receiverId` lança `TypeError`, e a mensagem técnica do erro ("Cannot read properties of undefined") é enviada ao cliente.
  - Se `content` vier ausente, o erro do SQLite ("NOT NULL constraint failed") é enviado ao cliente.
- **O que fazer:** Validar o payload do evento do socket com o mesmo rigor de uma requisição HTTP. Dados que chegam pelo socket também são dados externos.

### V-05. Textos sem limite de tamanho (Média)

- **Onde:** `src/modules/posts/post.controller.js:12` e `:73`; `src/modules/comments/comment.service.js:19` e `:72`; `src/modules/messages/message.service.js:8`.
- **Como está:** Só é verificado se o texto não está vazio.
- **Problema:** Um post, comentário ou mensagem pode ter qualquer tamanho. Isso quebra o layout do front-end e enche o banco com dados sem sentido.
- **O que fazer:** Definir um tamanho máximo para cada tipo de conteúdo e validar.

### V-06. O conteúdo do token não é conferido no middleware (Média)

- **Onde:** `src/middlewares/auth.middleware.js:21` (`authMiddleware`).
- **Como está:** `req.user = decoded` sem verificar o que tem dentro do token. Em `server.js:33` existe uma verificação do payload (`"id" in decoded`), mas no middleware HTTP não.
- **Problema:** Todo o projeto confia que `req.user.id` existe e é um número. Se o token for válido mas não tiver `id` (ex.: gerado por uma versão antiga do código), os controllers recebem `undefined` e se comportam de forma imprevisível. Por isso você acabou escrevendo `Number(req.user.id)` em alguns arquivos e `req.user.id` em outros (ver C-03).
- **O que fazer:** Validar o formato do payload do token **uma vez**, no middleware, para que o resto do código possa confiar em `req.user`.

### V-07. Cabeçalho `Authorization` não tem o formato conferido (Baixa)

- **Onde:** `src/middlewares/auth.middleware.js:13` (`authMiddleware`).
- **Como está:** `authorization.replace("Bearer ", "")`.
- **Problema:** Qualquer valor é aceito como token: `"Basic xyz"` vira o token `"Basic xyz"`, e `"bearer xyz"` (minúsculo) também não é tratado. Funciona por acaso, porque o `jwt.verify` falha depois, mas a mensagem de erro fica imprecisa.
- **O que fazer:** Conferir que o cabeçalho segue o formato `Bearer <token>` antes de extrair o token.

### V-08. Regras que existem só no código, e não no banco (Baixa)

- **Onde:** `src/config/database.js:35-43` (tabela `friendships`) e `:24-31` (tabela `posts`).
- **Como está:**
  - `friendships.status` aceita qualquer texto, mas só `pending` e `accepted` são válidos.
  - Nada no banco impede dois registros de amizade entre o mesmo par de usuários; só o `sendRequest` impede.
  - `posts` não tem `created_at`, enquanto `likes`, `comments` e `messages` têm.
- **Problema:** Se algum código futuro (ou um script manual) gravar direto no banco, os dados ficam inconsistentes. A tabela de `likes` já faz isso direito com o `UNIQUE (user_id, post_id)`: use-a como referência.
- **O que fazer:** Levar para o banco as regras que nunca podem ser quebradas. **Pesquise:** "sqlite CHECK constraint".

### V-09. JSON inválido e rotas inexistentes respondem em HTML (Média)

- **Onde:** `src/app.js` (final do arquivo, depois da linha 65).
- **Como está:** Não existe tratamento para rota não encontrada nem um tratador de erros global.
- **Problema:** Se o cliente mandar um JSON malformado, ou acessar uma rota que não existe, ou se algum erro não for capturado, o Express responde com uma **página HTML** padrão. Uma API JSON deveria sempre responder JSON, no mesmo formato.
- **O que fazer:** Garantir que toda resposta de erro da API (inclusive 404 de rota e JSON inválido) siga o mesmo formato JSON. **Pesquise:** "express error handling middleware".

---

## Parte 4: código repetido (DRY)

**DRY** significa *Don't Repeat Yourself* ("não se repita"). A ideia: cada regra ou lógica deve existir em **um lugar só**. Quando a mesma coisa está escrita em cinco arquivos e a regra muda, você precisa lembrar de mudar nos cinco. Esquecer um é exatamente como bugs aparecem (você vai ver exemplos reais abaixo, onde a cópia ficou diferente do original).

Cuidado com o exagero: DRY é sobre **regras e conhecimento** repetidos, não sobre qualquer par de linhas parecidas.

### D-01. Tratamento de erro copiado em todos os controllers (Alta)

- **Onde:**
  - Bloco `try/catch` que responde "Erro interno do servidor" repetido em `src/modules/posts/post.controller.js` (linhas 21, 94, 133), `src/modules/likes/likes.controller.js` (34, 74, 105, 136) e `src/modules/comments/comment.controller.js` (28, 55, 85, 113).
  - Decisão de status HTTP **comparando o texto da mensagem de erro**: `src/modules/posts/post.controller.js:81`, `:87`, `:120`, `:126` e `src/modules/likes/likes.controller.js:23`, `:28`, `:63`, `:68`, `:100`, `:130`.
- **Como está:** Cada módulo sinaliza erro de um jeito diferente:
  - `users` e `auth` devolvem `null`;
  - `posts`, `likes` e `comments` devolvem `{ error: "texto" }`;
  - `friendships`, `messages` e `post.service.getPostsByUser` lançam `throw new Error("texto")`.
- **Problema:** Três formas diferentes de fazer a mesma coisa. Comparar o texto da mensagem é muito frágil: se alguém corrigir um acento em "Post não encontrado" no service, o controller deixa de reconhecer o erro e passa a responder 200 com `{ error: ... }`, sem nenhum aviso. Isso também é a causa raiz dos status errados do B-12.
- **O que fazer:** Escolher **um** padrão de erro para o projeto inteiro, em que o tipo do erro (e não o texto) defina o status HTTP, e tratar os erros em **um lugar central**, em vez de repetir `try/catch` em cada controller. **Pesquise:** "custom error classes javascript" e "express centralized error handler".

### D-02. Validação de ID repetida (Média)

- **Onde:** `src/modules/likes/likes.controller.js:13`, `:53`, `:90`, `:120` e `src/modules/posts/post.controller.js:39`, `:67`, `:112`.
- **Como está:** O mesmo bloco "converte o ID e responde 400 se for inválido" aparece sete vezes, e as cópias de `posts` já ficaram diferentes das de `likes` (ver V-01). Nos outros módulos, a validação nem existe.
- **Problema:** É o exemplo clássico de como cópias divergem com o tempo.
- **O que fazer:** Ter uma única regra de validação de ID, reutilizada em todas as rotas que recebem ID.

### D-03. Validação de conteúdo de texto repetida (Média)

- **Onde:** `src/modules/posts/post.controller.js:12` e `:73`; `src/modules/comments/comment.service.js:19` e `:72`.
- **Como está:** A mesma checagem "não pode estar vazio" está repetida, e em camadas diferentes: em `posts` fica no controller, em `comments` fica no service. Em `messages` nem existe (V-04).
- **Problema:** Além da repetição, não fica claro **onde** a validação deve morar no projeto. Cada módulo decidiu de um jeito.
- **O que fazer:** Definir em qual camada a validação de entrada acontece (a Parte 1 sugere: na entrada) e concentrar a regra de conteúdo em um lugar.

### D-04. A busca "post existe?" está escrita quatro vezes (Média)

- **Onde:**
  - `src/modules/posts/post.model.js:71` (`findPostById`);
  - `src/modules/likes/likes.model.js:5` (`findPostById`), uma cópia com o mesmo nome em outro arquivo;
  - `src/modules/comments/comment.service.js:26` (`createComment`) e `:49` (`getCommentsByPost`), com SQL escrito direto no service.
- **Como está:** O módulo de comentários até importa o banco direto no service (`src/modules/comments/comment.service.js:11`), pulando a camada de model.
- **Problema:** Quatro lugares para manter a mesma consulta. E o service acessando o banco direto quebra a organização em camadas que o resto do projeto segue (controller -> service -> model).
- **O que fazer:** Ter uma única forma de buscar um post pelo ID, reutilizada pelos módulos que precisam dela, e manter o acesso ao banco sempre no model. Dentro de `src/modules/likes/likes.service.js`, o bloco "busca o post e devolve erro se não existir" também está repetido quatro vezes (linhas 6, 35, 63 e 80).

### D-05. A busca "relação entre dois usuários" está escrita três vezes (Média)

- **Onde:** `src/modules/friendships/friendship.model.js:24` (`findFriendship`), `:189` (`areFriends`) e `:210` (`getFriendshipStatus`).
- **Como está:** As três funções fazem a mesma consulta (`(requester = A e addressee = B) ou (requester = B e addressee = A)`), mudando só as colunas e o filtro de status.
- **Problema:** Se a regra de "relação entre dois usuários" mudar, você precisa lembrar de três lugares. Na mesma linha, a expressão `CASE` de `getFriends` (linhas 131-135 e 143-147) também está duplicada dentro da própria consulta.
- **O que fazer:** Centralizar a consulta da relação entre dois usuários e derivar as outras respostas dela.

### D-06. Regra "não pode ser você mesmo + precisa ser amigo" repetida (Média)

- **Onde:** `src/modules/messages/message.service.js:10-19` (`createMessage`), `:30-39` (`getConversation`) e `:50-59` (`deleteConversation`); a mesma ideia em `src/modules/posts/post.service.js:18-28` e `src/modules/friendships/friendship.service.js:7` e `:88`.
- **Como está:** O mesmo par de verificações é copiado em cada função, mudando só o texto do erro.
- **Problema:** Se a regra mudar (ex.: "pode mandar mensagem para amigos e para quem tem pedido pendente"), você terá que achar e mudar cada cópia.
- **O que fazer:** Extrair essa regra para uma função reutilizável dentro do domínio de amizades/mensagens.

### D-07. Verificação de "dono do recurso" repetida (Baixa)

- **Onde:** `src/modules/posts/post.service.js:37-57` (`update`) e `:63-83` (`remove`); `src/modules/comments/comment.service.js:79-92` (`updateComment`) e `:115-128` (`deleteComment`); `src/modules/users/user.controller.js:78` e `:112`.
- **Como está:** Em cada lugar: busca o registro, verifica se existe, verifica se `user_id` é igual ao usuário logado.
- **Problema:** Mesma regra escrita seis vezes, em camadas diferentes (service em posts/comments, controller em users).
- **O que fazer:** Padronizar como a verificação de "dono" é feita e em qual camada ela acontece.

### D-08. Verificação do token duplicada entre HTTP e Socket.IO (Média)

- **Onde:** `server.js:23-45` (middleware do Socket.IO) e `src/middlewares/auth.middleware.js:3-30` (`authMiddleware`).
- **Como está:** As duas fazem a mesma coisa (ler token, verificar, extrair usuário), mas **de jeitos diferentes**: a do socket valida o payload e converte o `id` para número; a do HTTP não faz nenhuma das duas coisas.
- **Problema:** Exemplo real de cópia que divergiu. Um mesmo token pode ser aceito em um canal e se comportar diferente no outro.
- **O que fazer:** Ter uma única função que verifica e interpreta o token, usada pelos dois canais.

### D-09. Repetições menores (Baixa)

- `src/modules/messages/message.model.js:17-25` e `:39-45`: a lista de colunas da mensagem é escrita duas vezes.
- `src/modules/users/user.controller.js:5` (`publicUser`) e `src/modules/auth/auth.controller.js:14-18`: o "formato público do usuário" é montado de dois jeitos diferentes (um tem `email`, o outro não).

---

## Parte 5: inconsistências e limpeza

### C-01. Respostas de erro com formatos diferentes (Média)

- **Onde:**
  - `src/modules/messages/message.controller.js:17` e `:35` respondem `{ error: "..." }`;
  - `src/modules/likes/likes.controller.js:24`, `:29`, `:64`, `:69`, `:101`, `:131` repassam o objeto do service, que também é `{ error: "..." }`;
  - os demais módulos respondem `{ message: "..." }`.
- **Problema:** O front-end precisa saber em qual endpoint procurar `error` e em qual procurar `message`. Uma API deve ter um único formato de erro.
- **O que fazer:** Definir um formato de resposta de erro e usar em todos os endpoints (resolve junto com D-01 e V-09).

### C-02. Nomes de campos misturando `snake_case` e `camelCase` (Baixa)

- **Onde:** `posts` e `comments` respondem `user_id`, `post_id`, `created_at` (`src/modules/posts/post.model.js:18`, `src/modules/comments/comment.model.js:31-33`). `friendships` e `messages` respondem `requesterId`, `senderId`, `createdAt` (`src/modules/friendships/friendship.model.js:48`, `src/modules/messages/message.model.js:20`).
- **Problema:** O contrato da API fica imprevisível para quem consome. Além disso, `src/modules/posts/post.model.js:100` e `:138` devolvem o campo `changes`, que é um detalhe interno do banco e não deveria fazer parte da resposta.
- **O que fazer:** Escolher uma convenção de nomes para a API e aplicá-la em todas as respostas.

### C-03. O ID do usuário logado é tratado de dois jeitos (Baixa)

- **Onde:** `Number(req.user.id)` em `src/modules/comments/comment.controller.js` (17, 72, 102) e `src/modules/messages/message.controller.js` (9, 28, 46); `req.user.id` direto em `posts`, `likes` e `friendships`.
- **Problema:** Mostra que o código não tem certeza do tipo de `req.user.id`. É sintoma do V-06.
- **O que fazer:** Depois de resolver o V-06, o tipo passa a ser garantido e a conversão espalhada deixa de ser necessária.

### C-04. Parâmetros com a mesma função em ordens diferentes (Baixa)

- **Onde:** `src/modules/posts/post.service.js:17` (`getPostsByUser(userId, targetUserId)`) chama `src/modules/posts/post.model.js:26` (`getPostsByUser(user_id, currentUserId)`).
- **Problema:** Funções com o mesmo nome recebem "usuário logado" e "usuário alvo" em ordens invertidas. Hoje está certo, mas é muito fácil alguém trocar a ordem em uma mudança futura e mostrar os posts errados.
- **O que fazer:** Padronizar nomes e ordem dos parâmetros entre as camadas.

### C-05. O mesmo `:id` significa coisas diferentes nas rotas de amizade (Baixa)

- **Onde:** `src/modules/friendships/friendship.routes.js`: nas linhas 15 e 53, `:id` é o **ID de um usuário**; nas linhas 29, 36 e 46, `:id` é o **ID de uma amizade**.
- **Problema:** É fácil o front-end mandar o ID do usuário para `DELETE /friendships/:id` esperando desfazer a amizade com ele, e o código remover outra amizade (ou nenhuma).
- **O que fazer:** Deixar claro na rota qual entidade o ID representa.

### C-06. Organização das rotas em `app.js` (Baixa)

- **Onde:** `src/app.js:47-65`.
- **Como está:** `users` é montado em `/users`, `posts` e `friendships` em `/`, e `likes`, `comments` e `messages` sem prefixo. As rotas de `posts` definem `/users/:id/posts` dentro do próprio arquivo.
- **Problema:** Para descobrir onde está uma rota, é preciso abrir vários arquivos. Rotas de um módulo acabam "invadindo" o caminho de outro.
- **O que fazer:** Adotar um critério único de prefixo para os módulos.

### C-07. Código de depuração esquecido (Baixa)

- **Onde:**
  - `src/modules/users/user.service.js:121` e `:126` (`deleteUserById`): `"Entrei no if"`, `"sai do if"`;
  - `src/middlewares/auth.middleware.js:4`, `:18`, `:19`, `:25`: imprime no terminal o conteúdo de todo token recebido;
  - `server.js:69-75`: evento `ping` de teste;
  - `server.js:52`, `:53`, `:63`, `:92`, `:108`: logs de cada conexão e mensagem.
- **Problema:** Polui o terminal e esconde os logs que importam.
- **O que fazer:** Remover o que era só para teste. Para o que deve continuar sendo registrado, **pesquise:** "structured logging node pino".

### C-08. Código morto e redundante (Baixa)

- **Onde:**
  - `src/modules/users/user.model.js:124` (`findUserByname`): não é usada em lugar nenhum, e o nome tem `n` minúsculo.
  - `src/modules/auth/auth.service.js:6` (`findUserByEmail`): exportada e nunca usada.
  - `src/modules/users/user.service.js:36-46` (`getById`): o `if (!user) return null; return user;` não muda nada, o resultado é o mesmo sem ele.
  - `src/modules/users/user.controller.js:70` e `:105`: `if (!req.user)` é redundante quando a rota passa pelo middleware (e é sintoma do B-06).
  - `src/modules/comments/comment.service.js:97` e `:133`: o `if (result.changes === 0)` nunca é verdadeiro naquele ponto, porque o comentário já foi encontrado logo antes. No SQLite, um `UPDATE` com o mesmo texto também conta como 1 alteração, então a mensagem "Nenhuma alteração foi realizada" nunca aparece nesse caso.
  - `src/modules/messages/message.controller.js:44` e `:49` (`deleteConversation`): `async`/`await` sobre uma função que não é assíncrona. Funciona, mas engana quem lê.
- **O que fazer:** Remover o que não é usado e o que não tem efeito.

### C-09. Comentários desatualizados ou que explicam o óbvio (Baixa)

- **Onde:**
  - `src/modules/users/user.service.js:91-97`: o cabeçalho "Função que atualiza usuário" está vazio e o "Função que exclui usuário pelo ID" está em cima da função `update`.
  - `src/modules/users/user.model.js:74`: diz "Atualiza o nome", mas a função atualiza nome **e** e-mail.
  - Vários arquivos têm comentários que explicam sintaxe básica (o que é `SELECT *`, o que é `?`, o que o `!` faz).
- **Problema:** Comentário errado é pior que nenhum: quem lê confia nele. E comentário que repete o código vira ruído e envelhece mal.
- **O que fazer:** Manter comentários que explicam o **porquê** de uma decisão, e não o **o quê** o código faz. **Pesquise:** "Clean Code comentários".

### C-10. Nomes inconsistentes (Baixa)

- `src/modules/posts/post.controller.js:61`: `updatePosts` (plural) atualiza um post só, enquanto os outros são `createPost` e `deletePost`.
- `src/modules/comments/comment.controller.js`: variável `resultado` (português), enquanto o resto do projeto usa `result`.
- `src/modules/likes/`: arquivos no plural (`likes.service.js`) e os outros módulos no singular (`post.service.js`, `comment.service.js`).

### C-11. `package.json` com informações erradas (Baixa)

- **Onde:** `package.json:5`, `:8` e `:23`.
- **Como está:** `"main": "index.js"` aponta para um arquivo que não existe; o `nodemon` está instalado, mas o `start` usa `node --watch`; não existe script de teste.
- **O que fazer:** Corrigir o `main`, remover dependências não usadas e separar o script de desenvolvimento (com `--watch`) do script de execução normal.

---

## Resumo

| ID | Tema | Prioridade |
|----|------|------------|
| B-01 | Tabela `users` não é criada | Alta |
| B-02 | Caminho relativo do banco | Média |
| B-03 | Chaves estrangeiras desligadas | Alta |
| B-04 | E-mail sem unicidade | Alta |
| B-05 | Usuários sem e-mail/senha derrubam o login | Alta |
| B-06 | Excluir usuário nunca funciona | Alta |
| B-07 | `req.body` ausente gera 500 (Express 5) | Alta |
| B-08 | `.trim()` em valor que não é texto | Média |
| B-09 | Login sem campos gera 500 | Média |
| B-10 | Atualizar usuário sem nome gera 500 | Média |
| B-11 | Criar post ignora o ID da URL | Média |
| B-12 | Status HTTP errados | Média |
| B-13 | Ordenação com empate por segundo | Média |
| B-14 | Regras de visibilidade inconsistentes | Média |
| B-15 | Usuário inexistente devolve 403 | Baixa |
| B-16 | Apagar conversa apaga para os dois | A confirmar |
| V-01 | IDs da URL sem validação | Alta |
| V-02 | Cadastro com validação fraca | Alta |
| V-03 | Erro de validação sem detalhe | Média |
| V-04 | Mensagens sem validação | Alta |
| V-05 | Textos sem limite de tamanho | Média |
| V-06 | Payload do token não validado | Média |
| V-07 | Formato do `Authorization` | Baixa |
| V-08 | Regras só no código, não no banco | Baixa |
| V-09 | Erros respondidos em HTML | Média |
| D-01 | Tratamento de erro repetido e frágil | Alta |
| D-02 | Validação de ID repetida | Média |
| D-03 | Validação de conteúdo repetida | Média |
| D-04 | "Post existe?" quatro vezes | Média |
| D-05 | "Relação entre usuários" três vezes | Média |
| D-06 | "Não é você + é amigo" repetida | Média |
| D-07 | "Dono do recurso" repetida | Baixa |
| D-08 | Verificação de token duplicada | Média |
| D-09 | Repetições menores | Baixa |
| C-01 | Formatos de erro diferentes | Média |
| C-02 | `snake_case` x `camelCase` | Baixa |
| C-03 | `req.user.id` tratado de dois jeitos | Baixa |
| C-04 | Ordem de parâmetros invertida | Baixa |
| C-05 | `:id` com significados diferentes | Baixa |
| C-06 | Prefixos de rota sem padrão | Baixa |
| C-07 | Código de depuração | Baixa |
| C-08 | Código morto | Baixa |
| C-09 | Comentários desatualizados | Baixa |
| C-10 | Nomes inconsistentes | Baixa |
| C-11 | `package.json` | Baixa |
