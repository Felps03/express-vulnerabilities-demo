const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Handler de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Rotas

app.get('/error', (req, res) => {
    // Não force erros aqui
    res.send('Tudo está funcionando corretamente.');
});

// Removido o endpoint de eval

app.post('/upload', (req, res) => {
    const fileContent = req.body.fileContent;
    const fileName = path.basename(req.body.fileName); // Previne Directory Traversal

    // Certifique-se de que está validando o tipo de arquivo aqui!
    
    fs.writeFileSync(`./uploads/${fileName}`, fileContent);
    res.send('Arquivo salvo com sucesso!');
});

app.get('/search', (req, res) => {
    const query = encodeURIComponent(req.query.q); // Escapa a saída
    res.send(`Resultados da pesquisa para: ${query}`);
});

app.get('/get-file', (req, res) => {
    const allowedFiles = ['file1.txt', 'file2.txt']; // Exemplo de lista de arquivos permitidos
    const fileName = req.query.filename;

    if (allowedFiles.includes(fileName)) {
        res.sendFile(path.join(__dirname, fileName));
    } else {
        res.status(403).send('Acesso negado.');
    }
});

app.get('/users', (req, res) => {
    const userId = Number(req.query.id); // Converte para número e evita injeção

    const user = fakeDatabase.users.find(u => u.id === userId);
    res.send(user);
});

let loginAttempts = {}; // Simula um limitador de taxa
app.post('/login', (req, res) => {
    const ip = req.ip;

    if (loginAttempts[ip] && loginAttempts[ip] > 3) {
        return res.status(429).send('Muitas tentativas. Por favor, tente mais tarde.');
    }

    const username = req.body.username;
    const password = req.body.password;
    const user = fakeDatabase.users.find(u => u.username === username && u.password === password);

    if (user) {
        loginAttempts[ip] = 0;
        res.send('Login bem-sucedido!');
    } else {
        loginAttempts[ip] = (loginAttempts[ip] || 0) + 1;
        res.send('Credenciais incorretas!');
    }
});

app.listen(port, () => {
    console.log(`Aplicativo rodando em http://localhost:${port}`);
});
