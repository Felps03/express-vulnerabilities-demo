const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rotas

// 1. Exposição de detalhes de erros
app.get('/error', (req, res) => {
    throw new Error('Erro forçado');
});

// 2. Injeção de código via eval
app.get('/eval', (req, res) => {
    const result = eval(req.query.code);
    res.send(`Resultado: ${result}`);
});

// 3. Upload de arquivos não seguro
app.post('/upload', (req, res) => {
    const fileContent = req.body.fileContent;
    const fileName = req.body.fileName;

    fs.writeFileSync(`./uploads/${fileName}`, fileContent);

    res.send('Arquivo salvo com sucesso!');
});

// 4. Não escapar saída - possível XSS
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send(`Resultados da pesquisa para: ${query}`);
});

// 7. Exposição de diretório (Directory Traversal)
app.get('/get-file', (req, res) => {
    const fileName = req.query.filename;
    res.sendFile(path.join(__dirname, fileName));
});

// 8. SQL Injection (Simulação)
let fakeDatabase = {
    users: [
        { id: 1, username: 'alice', password: 'password123' }
    ]
};

app.get('/users', (req, res) => {
    const userId = req.query.id;
    const user = fakeDatabase.users.find(u => u.id === userId);
    res.send(user);
});

// 9. Não limitar tentativas de login - Vulnerável a ataques de força bruta
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = fakeDatabase.users.find(u => u.username === username && u.password === password);
    if (user) {
        res.send('Login bem-sucedido!');
    } else {
        res.send('Credenciais incorretas!');
    }
});

app.listen(port, () => {
    console.log(`Aplicativo vulnerável rodando em http://localhost:${port}`);
});
