<div align="center">

# Express Security Lab

### Laboratório de Vulnerabilidades e Mitigações em APIs Node.js

Projeto educacional em **Node.js** e **Express.js** para demonstrar vulnerabilidades comuns em aplicações web e suas respectivas estratégias de mitigação.

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Security](https://img.shields.io/badge/Security-OWASP%20Top%2010-critical?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Educational-blue?style=for-the-badge)

</div>

---

## Sobre o Projeto

O **Express Security Lab** é um laboratório prático criado para demonstrar, de forma controlada, como vulnerabilidades comuns podem surgir em APIs construídas com **Node.js** e **Express.js**.

O projeto possui duas abordagens principais:

- uma aplicação propositalmente vulnerável;
- uma aplicação com mitigações básicas aplicadas.

A ideia é permitir a comparação entre decisões inseguras de implementação e práticas mais adequadas para construção de APIs backend.

Este repositório foi criado com foco em estudo, demonstração técnica e portfólio profissional.

---

## Objetivo

O objetivo deste projeto é demonstrar vulnerabilidades comuns em aplicações Express.js, como:

- exposição de erros internos;
- execução insegura de código;
- upload de arquivos sem validação;
- Cross-Site Scripting;
- Directory Traversal;
- SQL Injection simulada;
- ausência de limite para tentativas de login.

Além disso, o projeto também mostra formas iniciais de mitigação para esses problemas, reforçando boas práticas de segurança no desenvolvimento backend.

---

## Por que este projeto é relevante?

Segurança em aplicações web não depende apenas do framework utilizado.

Mesmo usando um framework consolidado como o Express.js, vulnerabilidades podem ser introduzidas por decisões incorretas de implementação, ausência de validação, manipulação insegura de arquivos, tratamento inadequado de erros ou falta de controles em rotas sensíveis.

Este projeto demonstra esses riscos de forma simples, didática e comparativa.

---

## Stack Utilizada

| Tecnologia | Uso |
|---|---|
| Node.js | Runtime JavaScript no backend |
| Express.js | Framework para criação da API |
| JavaScript | Linguagem principal |
| File System | Simulação de leitura e gravação de arquivos |
| OWASP Top 10 | Referência conceitual para classificação dos riscos |

---

## Estrutura do Projeto

```bash
express-vulnerabilities-demo/
├── vulnerableApp.js      # Aplicação com vulnerabilidades intencionais
├── safeApp.js            # Aplicação com mitigações básicas
├── package.json          # Configuração do projeto
├── package-lock.json
├── .gitignore
└── README.md
```

---

## Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/Felps03/express-vulnerabilities-demo.git
```

### 2. Acesse a pasta do projeto

```bash
cd express-vulnerabilities-demo
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute a versão vulnerável

```bash
node vulnerableApp.js
```

A aplicação vulnerável será iniciada em:

```bash
http://localhost:3000
```

### 5. Execute a versão com mitigações

Em outro terminal, ou após parar a aplicação anterior:

```bash
node safeApp.js
```

A aplicação segura também será iniciada em:

```bash
http://localhost:3000
```

> Observação: como as duas aplicações usam a mesma porta, execute apenas uma por vez ou altere a porta de uma delas.

---

## Aplicações Disponíveis

| Arquivo | Descrição |
|---|---|
| `vulnerableApp.js` | Contém exemplos intencionais de vulnerabilidades |
| `safeApp.js` | Contém correções e mitigações básicas para os mesmos cenários |

---

## Vulnerabilidades Demonstradas

| Vulnerabilidade | Rota | Risco |
|---|---|---|
| Exposição de detalhes de erro | `GET /error` | Exibe informações internas da aplicação |
| Execução dinâmica com `eval` | `GET /eval?code=` | Permite execução insegura de código |
| Upload inseguro | `POST /upload` | Permite gravação de arquivos sem validação adequada |
| Cross-Site Scripting | `GET /search?q=` | Renderiza entrada do usuário sem tratamento |
| Directory Traversal | `GET /get-file?filename=` | Permite tentativa de acesso indevido a arquivos |
| SQL Injection simulada | `GET /users?id=` | Demonstra uso inseguro de entrada do usuário |
| Brute Force | `POST /login` | Permite múltiplas tentativas de login sem limitação |

---

## Comparação: Versão Vulnerável vs Versão Segura

| Cenário | Versão Vulnerável | Versão com Mitigação |
|---|---|---|
| Tratamento de erros | Exibe erro interno diretamente | Retorna mensagem genérica |
| Execução de código | Usa `eval` com entrada do usuário | Remove o endpoint inseguro |
| Upload de arquivos | Usa nome enviado pelo usuário diretamente | Usa `path.basename` para reduzir risco de path traversal |
| Busca | Renderiza entrada sem escape | Codifica a saída antes de responder |
| Acesso a arquivos | Usa entrada do usuário para montar caminho | Usa allowlist de arquivos permitidos |
| Consulta de usuário | Usa parâmetro sem validação adequada | Converte o ID para número |
| Login | Não limita tentativas | Simula controle de tentativas por IP |

---

## Relação com OWASP Top 10

Este projeto se relaciona com categorias importantes da OWASP Top 10.

| Categoria OWASP | Relação com o Projeto |
|---|---|
| A03: Injection | Demonstra riscos como SQL Injection simulada, uso de `eval` e XSS |
| A05: Security Misconfiguration | Demonstra exposição de erros internos e ausência de hardening |
| A07: Identification and Authentication Failures | Demonstra ausência de controle contra múltiplas tentativas de login |
| A01: Broken Access Control | Demonstra acesso indevido a arquivos por manipulação de caminho |

Referências:

- https://owasp.org/Top10/
- https://owasp.org/Top10/A03_2021-Injection/
- https://owasp.org/Top10/A05_2021-Security_Misconfiguration/
- https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/

---

## Endpoints

### `GET /error`

Demonstra o risco de expor detalhes internos da aplicação ao usuário final.

Na versão vulnerável, a rota força um erro.  
Na versão segura, a aplicação evita expor informações sensíveis.

---

### `GET /eval?code=`

Demonstra o risco de executar código dinâmico a partir de entrada externa.

Exemplo:

```bash
http://localhost:3000/eval?code=2+2
```

Na versão vulnerável, a rota usa `eval`.  
Na versão segura, esse endpoint é removido.

---

### `POST /upload`

Demonstra problemas relacionados ao upload de arquivos sem validação.

Exemplo de body:

```json
{
  "fileName": "arquivo.txt",
  "fileContent": "conteúdo do arquivo"
}
```

Na versão vulnerável, o nome do arquivo é usado diretamente.  
Na versão segura, o nome do arquivo passa por uma normalização básica.

---

### `GET /search?q=termo`

Demonstra o risco de renderizar entrada do usuário diretamente na resposta HTTP.

Exemplo:

```bash
http://localhost:3000/search?q=teste
```

Na versão vulnerável, o valor de `q` é retornado sem tratamento.  
Na versão segura, a saída é codificada antes de ser enviada.

---

### `GET /get-file?filename=file1.txt`

Demonstra o risco de Directory Traversal.

Exemplo:

```bash
http://localhost:3000/get-file?filename=file1.txt
```

Na versão vulnerável, o nome do arquivo é usado diretamente para montar o caminho.  
Na versão segura, o acesso é limitado a uma lista de arquivos permitidos.

---

### `GET /users?id=1`

Demonstra uma simulação de consulta insegura baseada em entrada do usuário.

Exemplo:

```bash
http://localhost:3000/users?id=1
```

Na versão vulnerável, o parâmetro é usado sem validação adequada.  
Na versão segura, o ID é convertido para número antes da busca.

---

### `POST /login`

Demonstra o risco de uma rota de autenticação sem controle de tentativas.

Exemplo de body:

```json
{
  "username": "alice",
  "password": "password123"
}
```

Na versão vulnerável, não existe limite de tentativas.  
Na versão segura, existe uma simulação de limitação por IP.

---

## Boas Práticas Demonstradas

Este projeto reforça práticas importantes para desenvolvimento seguro de APIs:

- nunca confiar diretamente em entradas do usuário;
- evitar execução dinâmica de código;
- não expor stack traces para o usuário final;
- validar e sanitizar parâmetros de entrada;
- escapar ou codificar saídas renderizadas;
- limitar tentativas em rotas sensíveis;
- restringir acesso a arquivos usando allowlist;
- separar exemplos vulneráveis de exemplos mitigados;
- documentar riscos técnicos de forma clara;
- pensar segurança desde a implementação.

---

## Melhorias Recomendadas

Algumas melhorias futuras que podem deixar o projeto ainda mais completo:

- adicionar `helmet` para headers de segurança;
- adicionar `express-rate-limit` para controle real de tentativas;
- adicionar validação com `zod`, `joi` ou `express-validator`;
- adicionar testes automatizados;
- adicionar coleção Postman ou Insomnia;
- adicionar Dockerfile;
- adicionar GitHub Actions;
- adicionar análise com `npm audit`;
- separar rotas em módulos;
- criar camada de middlewares;
- adicionar logs estruturados;
- criar exemplos de resposta segura para cada vulnerabilidade;
- criar tabela de severidade por risco;
- adicionar documentação visual do fluxo vulnerável vs mitigado.

---

## Sugestão de Scripts

Para melhorar a experiência de uso, o `package.json` pode receber scripts como:

```json
{
  "scripts": {
    "start:vulnerable": "node vulnerableApp.js",
    "start:safe": "node safeApp.js"
  }
}
```

Depois disso, seria possível executar:

```bash
npm run start:vulnerable
```

ou:

```bash
npm run start:safe
```

---

## Sugestão de Description para o GitHub

```text
Laboratório educacional em Node.js e Express.js demonstrando vulnerabilidades comuns em APIs REST e suas respectivas mitigações, com foco em OWASP Top 10, XSS, SQL Injection simulada, brute force, tratamento seguro de erros e hardening backend.
```

---

## Sugestão de Topics

```text
nodejs
expressjs
javascript
api-security
owasp
web-security
backend
devsecops
xss
sql-injection
brute-force
secure-coding
```

---

## Aviso de Segurança

Este projeto contém exemplos intencionalmente vulneráveis.

Não utilize este código em produção.  
Não exponha esta aplicação publicamente.  
Não execute este projeto em servidores compartilhados ou ambientes acessíveis pela internet.

O objetivo é exclusivamente educacional.

---

## O que este projeto demonstra

Este projeto demonstra conhecimentos em:

- desenvolvimento backend com Node.js;
- criação de APIs com Express.js;
- fundamentos de segurança em aplicações web;
- análise de vulnerabilidades comuns;
- mitigação de riscos em APIs;
- boas práticas de hardening;
- pensamento crítico sobre segurança;
- comunicação técnica para times de engenharia;
- alinhamento com referências como OWASP Top 10.

---

## Possível Evolução Arquitetural

Uma evolução natural deste projeto seria transformá-lo em um laboratório mais completo de segurança backend.

Exemplo de estrutura futura:

```bash
src/
├── vulnerable/
│   ├── routes/
│   └── app.js
├── secure/
│   ├── routes/
│   ├── middlewares/
│   └── app.js
├── shared/
│   ├── database/
│   └── utils/
└── tests/
```

Essa separação deixaria o projeto mais organizado e mais próximo de uma estrutura profissional.

---

## Autor

Desenvolvido por **Felipe Santos**.

Projeto criado como parte do portfólio técnico com foco em:

- arquitetura de software;
- backend;
- segurança em APIs;
- Node.js;
- Express.js;
- boas práticas de engenharia.

---

<div align="center">

### Segurança não é uma etapa final. É uma decisão de arquitetura desde o início.

</div>
