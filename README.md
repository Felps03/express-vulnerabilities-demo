# Aplicativo Demonstrativo de Vulnerabilidades em Express.js

Este aplicativo foi projetado para demonstrar algumas das vulnerabilidades mais comuns encontradas em aplicações Express.js. Ele serve como uma ferramenta educacional para entender e mitigar riscos de segurança em desenvolvimento web.

## Configuração

1. Instale as dependências necessárias:
```bash
npm i express
```

2. Rode o aplicativo:
```bash
node index.js
```

## Endpoints e Vulnerabilidades Demonstradas

1. **Exposição de Detalhes de Erros**
- Rota: `/error`
- Descrição: Esta rota força um erro e exibe a stack trace diretamente para o usuário, expondo detalhes internos da aplicação.

2. **Injeção de Código via `eval`**
- Rota: `/eval?code=<código_a_ser_avaliado>`
- Descrição: A rota aceita código JavaScript através de uma query e o executa, permitindo a possibilidade de injeção de código.

3. **Upload de Arquivos Não Seguro**
- Rota: `/upload` (POST)
- Descrição: Esta rota permite que os usuários façam upload de arquivos sem validação adequada.

4. **Não Escapar Saída - Possível XSS**
- Rota: `/search?q=<query>`
- Descrição: A entrada do usuário é diretamente renderizada no navegador sem ser escapada, permitindo ataques XSS.

5. **Exposição de Diretório (Directory Traversal)**
- Rota: `/get-file?filename=<nome_do_arquivo>`
- Descrição: Esta rota serve arquivos baseados na entrada do usuário, permitindo possivelmente acessar arquivos sensíveis fora do diretório pretendido.

6. **SQL Injection (Simulação)**
- Rota: `/users?id=<id_do_usuario>`
- Descrição: Mesmo sendo uma simulação (sem um banco de dados real), esta rota ilustra como usar diretamente a entrada do usuário em uma query pode ser perigoso.

7. **Não Limitar Tentativas de Login**
- Rota: `/login` (POST)
- Descrição: A rota permite tentativas ilimitadas de login, tornando-a vulnerável a ataques de força bruta.

## Recomendações de Segurança

Este aplicativo é estritamente para fins educativos e não deve ser usado em produção. Se estiver desenvolvendo um aplicativo real com Express.js, sempre siga as melhores práticas de segurança e considere usar middlewares e ferramentas adicionais para fortalecer a segurança de sua aplicação.

## Conclusão

Entender as vulnerabilidades e como elas podem ser exploradas é o primeiro passo para escrever um código mais seguro. Use este aplicativo como um ponto de partida em sua jornada de aprendizado em segurança web.# express-vulnerabilities-demo
