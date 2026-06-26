# Arquitetura

## Visão macro

```
aura-meu-negocio/                          (raiz do repositório Git)
├── aura-meu-negocio/                      (frontend — SPA React)
├── aura-meu-negocio-backend/
│   └── aura-meu-negocio-backend/          (backend — API Express)
├── package.json / node_modules/           (ver "Pendências" abaixo)
└── .claude/                               (esta documentação)
```

Não há workspaces (npm/yarn/pnpm) configurados ligando os dois pacotes — cada um tem seu próprio `package.json`, `node_modules` e ciclo de vida (`npm install`/`npm run dev` precisam ser executados separadamente em cada pasta).

## Fluxo de comunicação

```
Browser (SPA React, porta padrão do Vite 5173)
        │  Axios — baseURL "http://localhost:3000" (hardcoded)
        ▼
Backend Express (porta 3000, padrão local; configurável via .env PORT)
        │  pg.Pool (SQL parametrizado)
        ▼
PostgreSQL (host: easypanel.aura-ia.cloud, database "n8n")
        │
        └─ Webhook HTTP ─▶ n8n (https://n8n.aura-ia.cloud/webhook/enviar-codigo)
                                  └─▶ envia código de verificação via WhatsApp
```

Pontos relevantes:

- O frontend chama o backend via Axios com `baseURL` fixo em `http://localhost:3000` (`src/services/api.ts`). Não há variável de ambiente (`.env`) no frontend para configurar essa URL — é um valor fixo no código.
- O backend não tem camada de fila/job; o envio de código de recuperação de senha é delegado de forma síncrona a um webhook externo do n8n.
- O banco de dados PostgreSQL usado pelo backend (`DB_NAME=n8n`) tem o mesmo nome do banco que tipicamente hospeda as tabelas internas do n8n. Não está claro se é o **mesmo banco físico** compartilhado entre a aplicação e o n8n, ou apenas uma coincidência de nome de schema. Ver Pendências.

## Organização em camadas

### Frontend
SPA single-page, sem SSR, renderizada 100% no cliente via Vite + React. Roteamento client-side com React Router. Sem chamada a uma camada de cache/state management além do React Context (usado apenas para o estado de colapso da sidebar).

### Backend
Arquitetura em camadas simples, por módulo de feature:

```
routes  →  controller  →  service  →  pool (PostgreSQL)
```

Hoje existe apenas o módulo `auth`. Não há camada de "repository" separada — as queries SQL ficam diretamente nos arquivos `*.service.ts`.

## Infraestrutura observada

- Banco de dados hospedado em `easypanel.aura-ia.cloud` (Easypanel, plataforma de hospedagem self-service para containers).
- Automação de mensageria (envio de código via WhatsApp) via instância n8n em `n8n.aura-ia.cloud`.
- Não há Dockerfile, docker-compose, CI/CD (GitHub Actions, etc.) neste repositório no momento da análise.

## Pendências

- Confirmar se o banco PostgreSQL (`DB_NAME=n8n`) é compartilhado entre a aplicação e a instância n8n, ou se são instâncias/bancos distintos com nome coincidente.
- Não há documentação de ambientes (dev/staging/produção) nem de processo de deploy — confirmar se existe e onde.
- Confirmar se há (ou está planejado) algum API Gateway, proxy reverso para apontar o frontend a diferentes URLs de backend por ambiente (em 2026-06-25 a `baseURL` passou a ser configurável via `VITE_API_URL`, ver [frontend.md](./frontend.md), mas ainda não há estratégia formal de múltiplos ambientes).

## Atualização (2026-06-25)

O `package.json`/`node_modules` que existia na raiz do repositório (`c:\Users\Marcello\aura-meu-negocio\`) foi investigado e removido. Ele não era resquício morto: o frontend dependia silenciosamente dele para resolver `axios`, `tailwindcss` e `@tailwindcss/vite` (Node sobe a árvore de diretórios procurando `node_modules`). Essas 3 dependências foram declaradas e instaladas localmente em `aura-meu-negocio/package.json`, e a pasta/arquivos da raiz foram removidos após validar que o build continua funcionando sem eles. Ver [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md).
