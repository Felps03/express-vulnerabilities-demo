const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../safeApp');

const uploadsDir = path.join(__dirname, '..', 'uploads');

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

async function requestJson(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return {
    status: response.status,
    headers: response.headers,
    body,
  };
}

test('safeApp.js', async (t) => {
  const { server, baseUrl } = await startTestServer();

  t.after(async () => {
    await stopTestServer(server);
  });

  await t.test('GET /error deve retornar erro genérico sem expor stack trace', async () => {
    const response = await requestJson(baseUrl, '/error');

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {
      error: 'Erro interno no servidor.',
    });
  });

  await t.test('GET /eval deve estar removido por segurança', async () => {
    const response = await requestJson(baseUrl, '/eval?code=2+2');

    assert.equal(response.status, 410);
    assert.deepEqual(response.body, {
      error: 'Este endpoint foi removido por risco de execução arbitrária de código.',
    });
  });

  await t.test('GET /search deve rejeitar busca sem parâmetro q', async () => {
    const response = await requestJson(baseUrl, '/search');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'Parâmetro q é obrigatório.',
    });
  });

  await t.test('GET /search deve escapar HTML para reduzir risco de XSS', async () => {
    const payload = '<script>alert("xss")</script>';
    const url = `/search?q=${encodeURIComponent(payload)}`;

    const response = await requestJson(baseUrl, url);

    assert.equal(response.status, 200);
    assert.equal(response.body.includes(payload), false);
    assert.equal(response.body.includes('&lt;script&gt;'), true);
    assert.equal(response.body.includes('&quot;xss&quot;'), true);
  });

  await t.test('GET /search deve rejeitar parâmetro q muito grande', async () => {
    const response = await requestJson(
      baseUrl,
      `/search?q=${'a'.repeat(101)}`
    );

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'Parâmetro q excedeu o tamanho máximo permitido.',
    });
  });

  await t.test('POST /upload deve rejeitar arquivo sem fileName', async () => {
    const response = await requestJson(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileContent: 'conteúdo de teste',
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'fileName é obrigatório.',
    });
  });

  await t.test('POST /upload deve rejeitar tentativa de path traversal no nome do arquivo', async () => {
    const response = await requestJson(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: '../malicioso.txt',
        fileContent: 'conteúdo malicioso',
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'Nome de arquivo inválido.',
    });
  });

  await t.test('POST /upload deve rejeitar extensão não permitida', async () => {
    const response = await requestJson(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'script.js',
        fileContent: 'console.log("malicioso")',
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'Extensão de arquivo não permitida.',
    });
  });

  await t.test('POST /upload deve salvar arquivo válido com sucesso', async () => {
    const fileName = `teste-${Date.now()}.txt`;
    const filePath = path.join(uploadsDir, fileName);

    const response = await requestJson(baseUrl, '/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileContent: 'conteúdo seguro',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.message, 'Arquivo salvo com sucesso.');
    assert.equal(response.body.fileName, fileName);
    assert.equal(fs.existsSync(filePath), true);

    fs.unlinkSync(filePath);
  });

  await t.test('GET /get-file deve rejeitar nome de arquivo inválido', async () => {
    const response = await requestJson(
      baseUrl,
      '/get-file?filename=../package.json'
    );

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'Nome de arquivo inválido.',
    });
  });

  await t.test('GET /get-file deve bloquear arquivo fora da allowlist', async () => {
    const response = await requestJson(
      baseUrl,
      '/get-file?filename=arquivo-nao-permitido.txt'
    );

    assert.equal(response.status, 403);
    assert.deepEqual(response.body, {
      error: 'Arquivo não permitido.',
    });
  });

  await t.test('GET /users deve rejeitar id inválido', async () => {
    const response = await requestJson(baseUrl, '/users?id=abc');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: 'ID inválido.',
    });
  });

  await t.test('GET /users deve retornar usuário sem expor senha', async () => {
    const response = await requestJson(baseUrl, '/users?id=1');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 1,
      username: 'alice',
    });

    assert.equal(Object.hasOwn(response.body, 'password'), false);
  });

  await t.test('GET /users deve retornar 404 quando usuário não existir', async () => {
    const response = await requestJson(baseUrl, '/users?id=999');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      error: 'Usuário não encontrado.',
    });
  });

  await t.test('POST /login deve rejeitar credenciais inválidas', async () => {
    const response = await requestJson(baseUrl, '/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alice',
        password: 'senha-incorreta',
      }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      error: 'Credenciais inválidas.',
    });
  });

  await t.test('POST /login deve aplicar rate limit após múltiplas tentativas', async () => {
    let lastResponse;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      lastResponse = await requestJson(baseUrl, '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'alice',
          password: `senha-incorreta-${attempt}`,
        }),
      });
    }

    assert.equal(lastResponse.status, 429);
    assert.deepEqual(lastResponse.body, {
      error: 'Muitas tentativas de login. Tente novamente mais tarde.',
    });
  });

  await t.test('GET rota inexistente deve retornar 404', async () => {
    const response = await requestJson(baseUrl, '/rota-inexistente');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      error: 'Rota não encontrada.',
    });
  });
});