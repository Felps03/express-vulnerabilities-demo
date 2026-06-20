const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../vulnerableApp');

const projectRoot = path.join(__dirname, '..');
const uploadsDir = path.join(projectRoot, 'uploads');

function startTestServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.on('error', reject);

    server.listen(0, () => {
      const address = server.address();

      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function stopTestServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestText(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: await response.text(),
  };
}

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function removeFileIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

test('vulnerableApp.js - comportamento inseguro esperado', async (t) => {
  const createdFiles = [];
  const { server, baseUrl } = await startTestServer();

  t.after(async () => {
    for (const filePath of createdFiles) {
      removeFileIfExists(filePath);
    }

    await stopTestServer(server);
  });

  await t.test('GET /eval deve executar expressão JavaScript recebida por query string', async () => {
    const response = await requestText(
      baseUrl,
      `/eval?code=${encodeURIComponent('2+2')}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Resultado: 4');
  });

  await t.test('GET /eval deve executar acesso ao runtime Node.js', async () => {
    const response = await requestText(
      baseUrl,
      `/eval?code=${encodeURIComponent('process.version')}`
    );

    assert.equal(response.status, 200);
    assert.match(response.body, /^Resultado: v\d+\.\d+\.\d+/);
  });

  await t.test('GET /eval deve executar acesso a variáveis de ambiente', async () => {
    const response = await requestText(
      baseUrl,
      `/eval?code=${encodeURIComponent('typeof process.env')}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Resultado: object');
  });

  await t.test('GET /eval deve retornar erro 500 quando código inválido for enviado', async () => {
    const response = await requestText(
      baseUrl,
      `/eval?code=${encodeURIComponent('2 2')}`
    );

    assert.equal(response.status, 500);
    assert.match(response.body, /SyntaxError|Unexpected number|Error/);
  });

  await t.test('GET /search deve refletir HTML sem escape, demonstrando XSS', async () => {
    const payload = '<script>alert("xss")</script>';

    const response = await requestText(
      baseUrl,
      `/search?q=${encodeURIComponent(payload)}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.includes(payload), true);
  });

  await t.test('GET /search deve refletir atributos HTML perigosos sem sanitização', async () => {
    const payload = '<img src=x onerror=alert(1)>';

    const response = await requestText(
      baseUrl,
      `/search?q=${encodeURIComponent(payload)}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.includes(payload), true);
  });

  await t.test('GET /search deve aceitar parâmetro muito grande sem validação de tamanho', async () => {
    const largePayload = 'a'.repeat(5000);

    const response = await requestText(
      baseUrl,
      `/search?q=${encodeURIComponent(largePayload)}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.includes(largePayload), true);
  });

  await t.test('POST /upload deve salvar arquivo com nome controlado pelo usuário', async () => {
    ensureUploadsDir();

    const fileName = `vulneravel-${Date.now()}.txt`;
    const filePath = path.join(uploadsDir, fileName);

    createdFiles.push(filePath);

    const response = await requestText(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileContent: 'arquivo criado por teste vulnerável',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Arquivo salvo com sucesso!');
    assert.equal(fs.existsSync(filePath), true);
    assert.equal(
      fs.readFileSync(filePath, 'utf8'),
      'arquivo criado por teste vulnerável'
    );
  });

  await t.test('POST /upload deve permitir sobrescrever arquivo existente', async () => {
    ensureUploadsDir();

    const fileName = `sobrescrever-${Date.now()}.txt`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, 'conteúdo original', 'utf8');
    createdFiles.push(filePath);

    const response = await requestText(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileContent: 'conteúdo sobrescrito',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Arquivo salvo com sucesso!');
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'conteúdo sobrescrito');
  });

  await t.test('POST /upload deve permitir path traversal e salvar arquivo fora de uploads', async () => {
    ensureUploadsDir();

    const outsideFileName = `arquivo-fora-${Date.now()}.txt`;
    const outsidePath = path.join(projectRoot, outsideFileName);
    const traversalFileName = `../${outsideFileName}`;

    createdFiles.push(outsidePath);

    const response = await requestText(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: traversalFileName,
        fileContent: 'arquivo salvo fora da pasta uploads',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Arquivo salvo com sucesso!');
    assert.equal(fs.existsSync(outsidePath), true);
    assert.equal(
      fs.readFileSync(outsidePath, 'utf8'),
      'arquivo salvo fora da pasta uploads'
    );
  });

  await t.test('POST /upload deve permitir extensão perigosa', async () => {
    ensureUploadsDir();

    const fileName = `payload-${Date.now()}.js`;
    const filePath = path.join(uploadsDir, fileName);

    createdFiles.push(filePath);

    const response = await requestText(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileContent: 'console.log("arquivo js salvo sem validação")',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Arquivo salvo com sucesso!');
    assert.equal(fs.existsSync(filePath), true);
  });

  await t.test('GET /get-file deve permitir leitura de arquivo na raiz do projeto', async () => {
    const fileName = `leitura-indevida-${Date.now()}.txt`;
    const filePath = path.join(projectRoot, fileName);

    fs.writeFileSync(filePath, 'conteúdo lido indevidamente', 'utf8');
    createdFiles.push(filePath);

    const response = await requestText(
      baseUrl,
      `/get-file?filename=${encodeURIComponent(fileName)}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body, 'conteúdo lido indevidamente');
  });

  await t.test('GET /get-file deve permitir leitura do package.json sem allowlist', async () => {
    const response = await requestText(baseUrl, '/get-file?filename=package.json');

    assert.equal(response.status, 200);
    assert.match(response.body, /"name"/);
    assert.match(response.body, /"scripts"/);
  });

  await t.test('GET /get-file deve permitir path traversal relativo', async () => {
    const parentFileName = `parent-read-${Date.now()}.txt`;
    const parentFilePath = path.join(projectRoot, '..', parentFileName);

    fs.writeFileSync(parentFilePath, 'arquivo fora do diretório do projeto', 'utf8');
    createdFiles.push(parentFilePath);

    const response = await requestText(
      baseUrl,
      `/get-file?filename=${encodeURIComponent(`../${parentFileName}`)}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body, 'arquivo fora do diretório do projeto');
  });

  await t.test('GET /users deve expor a senha do usuário', async () => {
    const response = await requestText(baseUrl, '/users?id=1');

    assert.equal(response.status, 200);
    assert.equal(response.body.includes('alice'), true);
    assert.equal(response.body.includes('password123'), true);
  });

  await t.test('GET /users deve aceitar parâmetro id como string sem validação forte', async () => {
    const response = await requestText(baseUrl, '/users?id=1');

    assert.equal(response.status, 200);
    assert.match(response.body, /alice/);
  });

  await t.test('GET /users sem id deve retornar resposta sem erro controlado', async () => {
    const response = await requestText(baseUrl, '/users');

    assert.equal(response.status, 200);
    assert.equal(response.body, '');
  });

  await t.test('POST /login deve permitir múltiplas tentativas sem rate limit', async () => {
    let lastResponse;

    for (let attempt = 0; attempt < 15; attempt += 1) {
      lastResponse = await requestText(baseUrl, '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'alice',
          password: `senha-incorreta-${attempt}`,
        }),
      });
    }

    assert.equal(lastResponse.status, 200);
    assert.equal(lastResponse.body, 'Credenciais incorretas!');
  });

  await t.test('POST /login deve diferenciar credencial incorreta de sucesso', async () => {
    const wrongResponse = await requestText(baseUrl, '/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alice',
        password: 'senha-incorreta',
      }),
    });

    const successResponse = await requestText(baseUrl, '/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alice',
        password: 'password123',
      }),
    });

    assert.equal(wrongResponse.status, 200);
    assert.equal(wrongResponse.body, 'Credenciais incorretas!');

    assert.equal(successResponse.status, 200);
    assert.equal(successResponse.body, 'Login bem-sucedido!');
  });

  await t.test('POST /login com body vazio deve retornar credenciais incorretas sem validação de campos', async () => {
    const response = await requestText(baseUrl, '/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body, 'Credenciais incorretas!');
  });

  await t.test('GET /error deve retornar erro 500 usando handler padrão do Express', async () => {
    const response = await requestText(baseUrl, '/error');

    assert.equal(response.status, 500);
    assert.match(response.body, /Error|Erro forçado/);
  });

  await t.test('GET rota inexistente deve retornar 404 padrão do Express', async () => {
    const response = await requestText(baseUrl, '/rota-inexistente');

    assert.equal(response.status, 404);
    assert.match(response.body, /Cannot GET \/rota-inexistente/);
  });
});