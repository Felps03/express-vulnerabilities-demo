const express = require("express");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const port = 3000;

const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.disable("x-powered-by");

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "10kb" }));

const fakeDatabase = {
  users: [
    {
      id: 1,
      username: "alice",
      password: "password123",
    },
  ],
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de login. Tente novamente mais tarde.",
  },
});

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidFileName(fileName) {
  if (!fileName || typeof fileName !== "string") {
    return false;
  }

  const normalizedName = path.basename(fileName);

  if (normalizedName !== fileName) {
    return false;
  }

  const allowedPattern = /^[a-zA-Z0-9._-]+$/;

  return allowedPattern.test(fileName);
}

function validateRequiredString(value, fieldName, maxLength = 255) {
  if (!value || typeof value !== "string") {
    return `${fieldName} é obrigatório.`;
  }

  if (value.length > maxLength) {
    return `${fieldName} excedeu o tamanho máximo permitido.`;
  }

  return null;
}

// 1. Tratamento seguro de erro
app.get("/error", (req, res, next) => {
  next(new Error("Erro forçado para teste interno"));
});

// 2. Endpoint inseguro removido
app.get("/eval", (req, res) => {
  res.status(410).json({
    error:
      "Este endpoint foi removido por risco de execução arbitrária de código.",
  });
});

// 3. Upload de arquivos com validação básica
app.post("/upload", (req, res) => {
  const { fileName, fileContent } = req.body;

  const fileNameError = validateRequiredString(fileName, "fileName", 100);
  const fileContentError = validateRequiredString(
    fileContent,
    "fileContent",
    5000,
  );

  if (fileNameError || fileContentError) {
    return res.status(400).json({
      error: fileNameError || fileContentError,
    });
  }

  if (!isValidFileName(fileName)) {
    return res.status(400).json({
      error: "Nome de arquivo inválido.",
    });
  }

  const allowedExtensions = [".txt", ".json", ".csv"];
  const fileExtension = path.extname(fileName).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      error: "Extensão de arquivo não permitida.",
    });
  }

  const safePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(safePath, fileContent, {
    encoding: "utf8",
    flag: "wx",
  });

  return res.status(201).json({
    message: "Arquivo salvo com sucesso.",
    fileName,
  });
});

// 4. Saída escapada para reduzir risco de XSS
app.get("/search", (req, res) => {
  const query = req.query.q;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      error: "Parâmetro q é obrigatório.",
    });
  }

  if (query.length > 100) {
    return res.status(400).json({
      error: "Parâmetro q excedeu o tamanho máximo permitido.",
    });
  }

  const safeQuery = escapeHtml(query);

  return res.send(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Busca</title>
      </head>
      <body>
        <h1>Resultados da pesquisa</h1>
        <p>Resultados da pesquisa para: ${safeQuery}</p>
      </body>
    </html>
  `);
});

// 5. Download com allowlist e path seguro
app.get("/get-file", (req, res) => {
  const fileName = req.query.filename;

  if (!isValidFileName(fileName)) {
    return res.status(400).json({
      error: "Nome de arquivo inválido.",
    });
  }

  const allowedFiles = new Set(["file1.txt", "file2.txt", "example.json"]);

  if (!allowedFiles.has(fileName)) {
    return res.status(403).json({
      error: "Arquivo não permitido.",
    });
  }

  const filePath = path.join(UPLOAD_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "Arquivo não encontrado.",
    });
  }

  return res.sendFile(filePath);
});

// 6. Consulta segura usando validação de tipo
app.get("/users", (req, res) => {
  const userId = Number(req.query.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      error: "ID inválido.",
    });
  }

  const user = fakeDatabase.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({
      error: "Usuário não encontrado.",
    });
  }

  return res.json({
    id: user.id,
    username: user.username,
  });
});

// 7. Login com rate limiting
app.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  const usernameError = validateRequiredString(username, "username", 50);
  const passwordError = validateRequiredString(password, "password", 100);

  if (usernameError || passwordError) {
    return res.status(400).json({
      error: usernameError || passwordError,
    });
  }

  const user = fakeDatabase.users.find(
    (item) => item.username === username && item.password === password,
  );

  if (!user) {
    return res.status(401).json({
      error: "Credenciais inválidas.",
    });
  }

  return res.json({
    message: "Login bem-sucedido.",
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

// Rota não encontrada
app.use((req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada.",
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);

  return res.status(500).json({
    error: "Erro interno no servidor.",
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Aplicativo seguro rodando em http://localhost:${port}`);
  });
}

module.exports = app;
