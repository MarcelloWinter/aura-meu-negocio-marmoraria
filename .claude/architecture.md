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
        │  Axios — baseURL via VITE_API_URL, hoje http://localhost:3010
        ▼
Backend Express (porta 3010; configurável via .env PORT)
        │  pg.Pool (SQL parametrizado)
        ▼
PostgreSQL (host: easypanel.aura-ia.cloud, database "n8n")
        │
        └─ Webhook HTTP ─▶ n8n (https://n8n.aura-ia.cloud/webhook/enviar-codigo)
                                  └─▶ envia código de verificação via WhatsApp
```

Pontos relevantes:

- O frontend chama o backend via Axios com `baseURL` configurável por `VITE_API_URL` (`src/services/api.ts`, fallback `http://localhost:3010`). **A porta mudou de 3000 para 3010 em 2026-08-27** — ver "Atualização (2026-08-27)" abaixo.
- O backend não tem camada de fila/job; o envio de código de recuperação de senha é delegado de forma síncrona a um webhook externo do n8n.
- **Confirmado em 2026-08-27**: o banco de dados PostgreSQL usado pelo backend (`DB_NAME=n8n`) é o **mesmo banco físico** da instância n8n em produção (128 tabelas no schema `public`, misturando tabelas internas do n8n com as tabelas de negócio deste app). Por isso o backend só pode tocar nas tabelas `_copy` (`clientes_copy`, `chats_copy`, `empresas_copy`) — nunca nas tabelas live. Ver [database.md](./database.md).

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

- Não há documentação de ambientes (dev/staging/produção) nem de processo de deploy — confirmar se existe e onde.
- Confirmar se há (ou está planejado) algum API Gateway, proxy reverso para apontar o frontend a diferentes URLs de backend por ambiente (em 2026-06-25 a `baseURL` passou a ser configurável via `VITE_API_URL`, ver [frontend.md](./frontend.md), mas ainda não há estratégia formal de múltiplos ambientes).
- Entender a relação entre este repositório (`aura-meu-negocio-marmoraria`) e `C:\Users\Marcello\aura-meu-negocio\` (`github.com/MarcelloWinter/aura-meu-negocio`) — um repositório Git **separado**, presente na mesma máquina, com estrutura de backend muito parecida (módulos `clientes`, `chats`, mas com autenticação JWT real e escopo por `empresa_id` que este repositório não tem). Note que a "Atualização (2026-06-25)" logo abaixo, escrita antes dessa descoberta, referencia a raiz deste repositório como `c:\Users\Marcello\aura-meu-negocio\` — provável confusão de nomes entre os dois projetos já naquela época, ou indício de que um se originou do outro. Não investigado a fundo; ver também o aviso 6 em [CLAUDE.md](./CLAUDE.md).

## Atualização (2026-06-25)

O `package.json`/`node_modules` que existia na raiz do repositório (`c:\Users\Marcello\aura-meu-negocio\`) foi investigado e removido. Ele não era resquício morto: o frontend dependia silenciosamente dele para resolver `axios`, `tailwindcss` e `@tailwindcss/vite` (Node sobe a árvore de diretórios procurando `node_modules`). Essas 3 dependências foram declaradas e instaladas localmente em `aura-meu-negocio/package.json`, e a pasta/arquivos da raiz foram removidos após validar que o build continua funcionando sem eles. Ver [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md).

## Atualização (2026-08-27)

- Confirmado que o Postgres é compartilhado com o n8n; adotada a regra de só usar tabelas `_copy` no backend. Ver [database.md](./database.md).
- Porta do backend mudou de 3000 para 3010, para não conflitar com o backend do repositório `aura-meu-negocio` (separado, ver Pendências acima) rodando na mesma máquina.
- Detalhes completos em [changelog.md](./changelog.md) (entrada de 2026-08-27).
