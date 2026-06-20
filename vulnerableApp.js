const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const fakeDatabase = {
  users: [
    {
      id: 1,
      username: "alice",
      password: "password123",
    },
  ],
};

// 1. Exposição de detalhes de erros
// Problema: sem error handler seguro, o erro pode expor detalhes internos.
app.get("/error", (req, res) => {
  throw new Error("Erro forçado");
});

// 2. Injeção de código via eval
// Problema: executa código recebido por query string.
app.get("/eval", (req, res) => {
  const result = eval(req.query.code);
  res.send(`Resultado: ${result}`);
});

// 3. Upload de arquivos não seguro
// Problema: usa o nome do arquivo enviado pelo usuário diretamente.
app.post("/upload", (req, res) => {
  const fileContent = req.body.fileContent;
  const fileName = req.body.fileName;

  if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
  }

  fs.writeFileSync(`./uploads/${fileName}`, fileContent);

  res.send("Arquivo salvo com sucesso!");
});

// 4. Não escapar saída - possível XSS
// Problema: renderiza diretamente uma entrada controlada pelo usuário.
app.get("/search", (req, res) => {
  const query = req.query.q;

  res.send(`
    <html>
      <body>
        <h1>Busca</h1>
        <p>Resultados da pesquisa para: ${query}</p>
      </body>
    </html>
  `);
});

// 5. Exposição de diretório - Directory Traversal
// Problema: permite montar caminho de arquivo com base em input externo.
app.get("/get-file", (req, res) => {
  const fileName = req.query.filename;

  res.sendFile(path.join(__dirname, fileName));
});

// 6. Consulta insegura simulando risco de Injection
// Observação: aqui não existe SQL real, então é melhor chamar de simulação.
app.get("/users", (req, res) => {
  const userId = req.query.id;

  const user = fakeDatabase.users.find((u) => String(u.id) === userId);

  res.send(user);
});

// 7. Não limitar tentativas de login
// Problema: vulnerável a tentativas repetidas de autenticação.
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = fakeDatabase.users.find(
    (u) => u.username === username && u.password === password,
  );

  if (user) {
    res.send("Login bem-sucedido!");
  } else {
    res.send("Credenciais incorretas!");
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Aplicativo vulnerável rodando em http://localhost:${port}`);
  });
}

module.exports = app;
