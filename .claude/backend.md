# Backend

Caminho: `aura-meu-negocio-backend/aura-meu-negocio-backend/`

## Stack

| Categoria | Biblioteca | Versão |
|---|---|---|
| Framework | Express | ^5.2.1 |
| Linguagem | TypeScript | ^6.0.3 (execução em dev via `ts-node`, build via `tsc`) |
| Banco de dados | PostgreSQL via `pg` (Pool) | ^8.21.0 |
| ORM | Nenhum — SQL puro parametrizado | — |
| Hash de senha | bcrypt | ^6.0.0 |
| Token | jsonwebtoken (JWT) | ^9.0.3 |
| CORS | cors | ^2.8.6 |
| Variáveis de ambiente | dotenv | ^17.4.2 |
| Validação | zod (instalado, **não utilizado** no código atual) | ^4.4.3 |
| Dev tooling | nodemon + ts-node | — |

Scripts (`package.json`):
- `npm run dev` — `nodemon --exec ts-node src/server.ts`
- `npm run build` — `tsc` (saída em `dist/`)
- `npm run start` — `node dist/server.js`

## Variáveis de ambiente (`.env`)

Nomes de variáveis existentes (valores sensíveis omitidos intencionalmente desta documentação):

```
PORT
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
```

- **`PORT` é `3010`** desde 2026-08-27 (antes era `3000`) — mudado porque a porta 3000 é usada pelo backend de **outro repositório Git**, `C:\Users\Marcello\aura-meu-negocio\` (`github.com/MarcelloWinter/aura-meu-negocio`), que roda separadamente na mesma máquina de desenvolvimento. `VITE_API_URL` no frontend (`aura-meu-negocio/.env` e `.env.example`) e o fallback em `src/services/api.ts` foram atualizados para `http://localhost:3010` de forma correspondente. Ver [architecture.md](./architecture.md) e Pendências.
- `DB_NAME=n8n`, `DB_HOST=easypanel.aura-ia.cloud`: **confirmado em 2026-08-27** que é o mesmo banco físico usado pela instância n8n de produção (não uma coincidência de nome). Ver [database.md](./database.md) para a regra de quais tabelas o backend pode tocar.

## Estrutura de pastas (`src/`)

```
src/
├── app.ts                          # Cria o app Express, registra middlewares globais e rotas
├── server.ts                       # Entry point: carrega .env, testa conexão com o banco, inicia o servidor HTTP
├── config/
│   └── database.ts                  # Pool de conexões PostgreSQL (node-postgres)
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts            # Mapeamento de rotas → controllers
│   │   ├── auth.controller.ts        # Camada HTTP: lê req.body, chama o service, formata a resposta
│   │   └── auth.service.ts           # Lógica de negócio + queries SQL diretas
│   ├── clientes/                     # Novo em 2026-08-27 — CRUD (parcial) sobre clientes_copy
│   │   ├── clientes.routes.ts
│   │   ├── clientes.controller.ts
│   │   └── clientes.service.ts
│   └── chats/                        # Novo em 2026-08-27 — leitura de chats_copy
│       ├── chats.routes.ts
│       ├── chats.controller.ts
│       └── chats.service.ts
├── middlewares/
│   └── auth.middleware.ts            # Arquivo vazio — middleware de validação de JWT NÃO implementado
└── utils/
    ├── jwt.ts                         # generateToken(payload) — assina JWT com expiração de 15 minutos
    └── password.ts                    # hashPassword / comparePassword (bcrypt, 10 salt rounds)
```

Padrão arquitetural: **modularização por feature**, com camadas `routes → controller → service → pool`. Não há camada de "repository" isolada; as queries SQL estão diretamente nos arquivos `*.service.ts`.

## Inicialização (`src/server.ts`)

1. Carrega variáveis de ambiente (`dotenv.config()`).
2. Executa `SELECT NOW()` no pool para validar a conexão com o PostgreSQL antes de subir o servidor.
3. Inicia o Express na porta definida por `process.env.PORT` (fallback `3000`).
4. Em caso de erro de conexão, apenas loga o erro no console (`console.error`) — não há retry nem encerramento explícito do processo.

## Middlewares globais (`src/app.ts`)

```ts
app.use(cors());              // CORS liberado para qualquer origem (sem allowlist configurada)
app.use(express.json());      // parsing de JSON no body
app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);  // novo em 2026-08-27
app.use("/chats", chatsRoutes);        // novo em 2026-08-27
```

Não há middleware de log de requisições (morgan ou similar), nem middleware de tratamento de erros global (`(err, req, res, next)`).

## Endpoints

### `/auth` (`src/modules/auth/auth.routes.ts`)

| Método | Rota | Controller | Service |
|---|---|---|---|
| POST | `/auth/login` | `login` | `authService.login(usuario, senha)` |
| POST | `/auth/forgot-password` | `forgotPassword` | `authService.forgotPassword(usuario)` |
| POST | `/auth/send-reset-code` | `sendResetCode` | `authService.sendResetCode(usuario)` |
| POST | `/auth/verify-code` | `verifyCode` | `authService.verifyCode(usuario, codigo)` |
| POST | `/auth/reset-password` | `resetPassword` | `authService.resetPassword(usuario, novaSenha)` |

### `/clientes` (novo em 2026-08-27, `src/modules/clientes/`)

| Método | Rota | Controller | Service | Observações |
|---|---|---|---|---|
| GET | `/clientes` | `listar` | `clientesService.listar()` | `SELECT` em `clientes_copy` com `LEFT JOIN enderecos`; retorna `cpf_cnpj`, `email` e os campos de endereço achatados (`endereco_cep`, `endereco_rua`, ...) |
| POST | `/clientes` | `criar` | `clientesService.criar(dados)` | Transação: insere em `enderecos` (se algum campo de endereço veio preenchido) e depois em `clientes_copy`, linkando via `endereco_id`. Body: `{ nome, numero, cpfCnpj?, email?, endereco? }` |
| DELETE | `/clientes/:id` | `remover` | `clientesService.remover(id)` | `DELETE FROM clientes_copy WHERE id = $1` |

Nenhuma rota de `/clientes` valida JWT ou aplica escopo por `empresa_id` ainda — qualquer chamada retorna/altera todos os registros de `clientes_copy`, independente de empresa.

### `/chats` (novo em 2026-08-27, `src/modules/chats/`)

| Método | Rota | Controller | Service | Observações |
|---|---|---|---|---|
| GET | `/chats` | `listar` | `chatsService.listar()` | `SELECT` em `chats_copy` com `LEFT JOIN clientes_copy` (nome do cliente), `ORDER BY data_ultima_conversa DESC NULLS LAST`. Só leitura — não há criação/edição de chat pela UI. |

Padrão de resposta de erro em todos os controllers: `try/catch`, retornando `res.status(<code>).json({ message })`, onde a mensagem vem do `Error` lançado pelo service (ou um fallback genérico).

| Endpoint | Status de erro | Status de sucesso |
|---|---|---|
| login | 401 | 200 (implícito via `res.json`) |
| forgot-password | 400 | 200 |
| send-reset-code | 400 | 200 |
| verify-code | 400 | 200 (explícito) |
| reset-password | 400 | 200 |

## Detalhe por endpoint (`auth.service.ts`)

### `login(usuario, senha)`
1. `SELECT * FROM usuarios WHERE usuario = $1 AND ativo = TRUE`.
2. Se não encontrar → `Error("Usuário ou senha inválidos")`.
3. Compara senha enviada com `comparePassword` (bcrypt) contra `user.senha`.
4. Se não bater → mesmo erro genérico (não revela qual campo está errado).
5. Gera JWT com payload `{ id, empresaId }`, expiração 15 minutos.
6. Retorna `{ token, usuario: { id, nome, empresaId } }`.

### `forgotPassword(usuario)`
- Apenas confirma que o usuário existe e está ativo. Retorna `{ success: true }`. Não dispara envio de código (isso é feito por `sendResetCode`, chamado separadamente pelo frontend).

### `sendResetCode(usuario)`
- Confirma existência/ativo do usuário.
- Faz `POST https://n8n.aura-ia.cloud/webhook/enviar-codigo` com `{ usuario }`.
- Se a resposta do webhook não tiver `success: true`, lança erro.
- **Não foi encontrado no código deste service nenhuma geração/persistência do código de verificação** — presumivelmente o código é gerado e salvo na tabela `recuperacao_senha` pelo próprio fluxo n8n (fora deste repositório). Ver Pendências.

### `verifyCode(usuario, codigo)`
1. Busca `id` do usuário ativo.
2. Busca em `recuperacao_senha` o registro mais recente (`ORDER BY created_at DESC LIMIT 1`) que bata `usuario_id`, `codigo`, `utilizado = FALSE` e `expiracao > NOW()`.
3. Se não encontrar → `Error("Código inválido ou expirado.")`.
4. Marca o registro como `utilizado = TRUE`.

### `resetPassword(usuario, novaSenha)`
1. Confirma existência/ativo do usuário.
2. Gera hash bcrypt da nova senha (10 salt rounds).
3. `UPDATE usuarios SET senha = $1 WHERE usuario = $2`.

**Observação de segurança**: `resetPassword` não verifica novamente se existe um código validado (`recuperacao_senha.utilizado = TRUE` recente) antes de permitir a troca — a garantia de que o fluxo de verificação foi cumprido depende inteiramente do frontend (`@aura:code-validated` no `localStorage`), que é client-side e pode ser manipulado. Ver [business-rules.md](./business-rules.md).

## Autenticação e autorização

- Login gera JWT (`HS256`, via `JWT_SECRET`), payload `{ id, empresaId }`, expiração 15 minutos.
- **Não existe middleware de verificação de JWT implementado** (`src/middlewares/auth.middleware.ts` está vazio) e nenhuma rota o utiliza.
- Como só existe o módulo `auth`, e suas rotas são intencionalmente públicas (login, recuperação de senha), isso ainda não afeta nenhum dado sensível — mas será um bloqueador assim que módulos de negócio (atendimento, agenda, financeiro etc.) expuserem endpoints no backend.
- Não há refresh token; o token expira em 15 minutos sem mecanismo de renovação.

## Tratamento de erros

- Cada controller individualmente captura exceções dos services e mapeia para um status HTTP.
- Não há middleware de erro global do Express — erros não tratados (ex.: falha de conexão com o banco no meio de uma query) resultariam em um erro não capturado/500 padrão do Express, sem formatação customizada.

## Pendências

- Onde e como o código de verificação (`recuperacao_senha.codigo`) é gerado e persistido? Não há código neste backend que insira esse registro — provavelmente feito pelo workflow do n8n diretamente no banco. Confirmar.
- Implementar (ou confirmar que está fora de escopo por ora) o middleware de autenticação JWT antes de adicionar rotas de negócio autenticadas — os módulos `clientes` e `chats` (novos em 2026-08-27) já são rotas de negócio e **ainda não passam por nenhuma autenticação/autorização**.
- Aplicar escopo por `empresa_id` em `/clientes` e `/chats` (hoje retornam/alteram todos os registros de `clientes_copy`/`chats_copy`, sem filtrar por empresa) — o outro repositório (`aura-meu-negocio`, ver [architecture.md](./architecture.md)) já resolve isso no módulo equivalente dele, pode servir de referência.
- Definir se `zod` (já instalado) será usado para validação de payloads de entrada — hoje não há validação de schema, apenas desestruturação direta de `req.body` (inclusive em `POST /clientes`).
- Confirmar política de CORS para produção (hoje `cors()` libera todas as origens).
- Confirmar se há necessidade de logging estruturado/observabilidade (hoje só `console.log`/`console.error`).
- Confirmar a estratégia de migrations/versionamento de schema do banco (não há pasta de migrations neste repositório — a tabela `enderecos` e as colunas novas em `clientes_copy`, de 2026-08-27, foram aplicadas via script Node ad-hoc, não commitado). Ver [database.md](./database.md).
- Decidir o que fazer com `chats_copy`/`empresas_copy`/`clientes_copy` esvaziadas por uma causa ainda não identificada em 2026-08-27 — ver Pendências em [database.md](./database.md).
