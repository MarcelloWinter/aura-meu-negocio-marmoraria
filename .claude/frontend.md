# Frontend

Caminho: `aura-meu-negocio/`

## Stack

| Categoria | Biblioteca | Versão |
|---|---|---|
| Framework UI | React | ^19.2.6 |
| Build tool | Vite | ^8.0.12 |
| Linguagem | TypeScript | ~6.0.2 |
| Roteamento | react-router-dom | ^6.30.4 |
| Estilização | Tailwind CSS (via `@tailwindcss/vite`) | — |
| HTTP client | axios | (sem versão fixada no `package.json` do app — ver Pendências) |
| Datas | date-fns (locale `pt-BR`) | ^4.4.0 |
| Ícones | lucide-react | ^1.20.0 |
| Lint | ESLint + typescript-eslint + eslint-plugin-react-hooks + eslint-plugin-react-refresh | — |

Scripts (`package.json`):
- `npm run dev` — inicia o Vite em modo desenvolvimento.
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — ESLint.
- `npm run preview` — preview do build de produção.

> Observação: `axios` é importado em `src/services/api.ts` mas não aparece listado em `aura-meu-negocio/package.json` (está presente no `package.json` da raiz do repositório, que é um pacote separado — ver Pendências em [architecture.md](./architecture.md)). Confirmar se isso não quebra o `npm install` dentro de `aura-meu-negocio/`.

## Estrutura de pastas (`src/`)

```
src/
├── App.tsx                # Definição de rotas (BrowserRouter + Routes)
├── main.tsx                # Entry point — monta <App /> no #root
├── index.css                # @import "tailwindcss" + CSS Variables globais
├── App.css                  # Estilos remanescentes do template Vite (não utilizado nas páginas)
├── assets/                  # Vazio atualmente
├── components/               # Componentes compostos / específicos de layout e auth
├── contexts/                 # AuthContext, ClientesContext, FinanceiroContext
├── pages/
│   ├── Auth/                 # Login, ForgotPassword, VerifyCode, ResetPassword
│   └── Modules/               # Service (Atendimento), Agenda, Clientes, Vendas, Financeiro, Equipe, Configuracoes
├── services/
│   └── api.ts                 # Instância Axios única
├── styles/
│   ├── theme.ts                # Objeto de tema JS (cores/radius) — não importado em nenhum lugar do app
│   └── globals.css             # CSS Variables (duplicado parcialmente com index.css)
└── ui/
    ├── Card.tsx                 # Componente de card "core" do design system
    └── PageHeader.tsx            # Cabeçalho de página "core" do design system
```

## Roteamento (`src/App.tsx`)

```
/                    → Login
/recuperar-senha     → ForgotPassword
/verificar-codigo    → VerifyCode
/resetar-senha       → ResetPassword
/atendimento         → Service (módulo Atendimento)
/agenda              → Agenda (módulo Agenda)
/clientes            → Clientes (módulo Clientes)
/vendas              → Vendas (módulo Vendas, novo em 2026-07-30)
/financeiro          → Financeiro (módulo Financeiro)
/equipe              → Equipe (módulo Equipe)
/configuracoes       → Configuracoes (módulo Configurações, novo em 2026-08-23)
```

> A lista acima já reflete `App.tsx` na íntegra (confirmado em 2026-08-23). O restante desta seção — abaixo da nota sobre rotas protegidas — ainda descreve o estado de 2026-06-25 e não foi reauditado nesta rodada; ver Pendências.

- Roteamento client-side via `BrowserRouter`/`Routes`/`Route` do `react-router-dom` v6.
- **Não existem rotas protegidas** (`ProtectedRoute`/`PrivateRoute`). Qualquer rota é acessível diretamente pela URL sem autenticação prévia.
- `/clientes` aceita os query params `?clienteId=` e `?nome=` (lidos via `useSearchParams`) para abrir automaticamente o modal de detalhe de um cliente ao navegar a partir de outro módulo — ver "Navegação cliente → cadastro" em [business-rules.md](./business-rules.md).

## Estado global

Contextos existentes (todos em `src/contexts/`), providos em `App.tsx` na ordem `AuthProvider > ClientesProvider > FinanceiroProvider > BrowserRouter`:

- **`ClientesContext`** — lista de clientes (`clientes[]`, `carregando`, `addCliente`, `deletarCliente`). `Cliente` ganhou campos opcionais `cpfCnpj`, `email` e `endereco` (2026-08-23). Consumido por `Clientes.tsx`, `ClienteSelect` (e, através dele, por `NovoAgendamentoModal`, "Nova receita" no Financeiro e `NovaVendaModal`). **Desde 2026-08-27, não é mais mockado**: busca `GET /clientes` num `useEffect` ao montar (`carregando` fica `true` até a resposta chegar); `addCliente` virou assíncrono e persiste via `POST /clientes`; `deletarCliente` remove otimista do estado local e dispara `DELETE /clientes/:id` em paralelo. Ver [backend.md](./backend.md) e [business-rules.md](./business-rules.md).
- **`FinanceiroContext`** (novo em 2026-07-30) — transações financeiras (`transacoes[]`, `addTransacao`, `deletarTransacao`, `registrarPagamento`). `Transacao` ganhou campo opcional `clienteId` (2026-08-23). Consumido por `Financeiro.tsx` e por `Vendas.tsx` (gera uma receita automaticamente ao aprovar um orçamento — ver [business-rules.md](./business-rules.md)).
- **`AuthContext`** — sessão do usuário (login/logout), criado em 2026-06-25. Desde 2026-08-23, `logout()` é chamado a partir de um botão real na Sidebar (antes só existia a função, sem UI que a acionasse).

Componente compartilhado `src/components/NovoClienteModal.tsx` (novo em 2026-08-23) encapsula o formulário completo de criação de cliente sobre `ClientesContext` — usado por `Clientes.tsx` e por `ClienteSelect.tsx`. Ver detalhes em [business-rules.md](./business-rules.md).

Não há mais `SidebarContext` — foi removido em 2026-06-25 junto com o `SidebarItem.tsx`/`menuItems.ts` que o consumiam (nenhuma página os referenciava; ver "Atualizações (2026-06-25)" abaixo). O `Sidebar.tsx` atual (usado em `DashboardLayout.tsx`) não usa Context algum: recebe `isOpen`/`onClose` via props e tem sua própria lista de menu hardcoded (`const menu = [...]`).

## Autenticação no frontend

- Login (`src/pages/Auth/Login.tsx`) chama `POST /auth/login`, recebe `{ token, usuario }` e grava em `localStorage`:
  - `@aura:token`
  - `@aura:user` (JSON do usuário)
- Fluxo de recuperação de senha usa chaves adicionais de `localStorage` como estado de sessão temporário entre páginas:
  - `@aura:reset-user` — usuário em processo de recuperação
  - `@aura:reset-user-id` — id retornado por `/auth/forgot-password` (quando presente)
  - `@aura:code-validated` — setado após validar o código de 6 dígitos; `ResetPassword.tsx` redireciona para `/` (login) no `useEffect` se essa flag não existir
- O token JWT **nunca é lido de volta** do `localStorage` para ser enviado em requisições futuras — não há interceptor do Axios adicionando `Authorization: Bearer <token>`.
- **Logout** (desde 2026-08-23): botão "Sair" no rodapé da Sidebar chama `useAuth().logout()` (limpa `@aura:token`/`@aura:user` do `localStorage`, zera o estado do contexto) e navega para `/`. Não há, ainda, expiração/refresh automático de token no cliente.

## Serviço HTTP (`src/services/api.ts`)

```ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3010",
});
```

- `baseURL` vem de `VITE_API_URL` (`.env`/`.env.example`). **Mudou de `3000` para `3010` em 2026-08-27** — a porta 3000 é usada pelo backend de um repositório Git totalmente separado (`C:\Users\Marcello\aura-meu-negocio\`, sem relação com este projeto) presente na mesma máquina de desenvolvimento; sem essa mudança, o frontend conversava com o backend errado sempre que os dois estivessem rodando ao mesmo tempo. Ver [architecture.md](./architecture.md) e [backend.md](./backend.md).
- Interceptors (desde 2026-06-25): injeta `Authorization: Bearer <token>` automaticamente quando há `@aura:token` no `localStorage`; limpa a sessão local em respostas `401`.
- Helper `getApiErrorMessage(error, fallback)` centraliza a leitura de `error.response.data.message`, usado pelas páginas de Auth e, desde 2026-08-27, por `ClientesContext` e `NovoClienteModal`.
- Cada página trata erros individualmente via `try/catch`, com fallback para uma mensagem genérica em português.

## Páginas de autenticação (`src/pages/Auth`)

| Página | Rota | Endpoint(s) chamados | Observações |
|---|---|---|---|
| `Login.tsx` | `/` | `POST /auth/login` | Validação client-side simples (campos obrigatórios); navega para `/atendimento` no sucesso |
| `ForgotPassword.tsx` | `/recuperar-senha` | `POST /auth/forgot-password`, depois `POST /auth/send-reset-code` | Navega para `/verificar-codigo` |
| `VerifyCode.tsx` | `/verificar-codigo` | `POST /auth/verify-code`, com reenvio via `POST /auth/send-reset-code` | Código limitado a 6 dígitos numéricos (`replace(/\D/g, "")`) |
| `ResetPassword.tsx` | `/resetar-senha` | `POST /auth/reset-password` | Redireciona para `/` se `@aura:code-validated` não estiver setado; limpa as chaves de `localStorage` de reset ao concluir; redireciona para `/` após 3s |

## Páginas de módulos (`src/pages/Modules`)

Ver detalhamento de regras em [business-rules.md](./business-rules.md). Resumo técnico:

- **Service.tsx** (`/atendimento`): **desde 2026-08-27, não é mais mockado** — busca `GET /chats` num `useEffect` e monta as colunas do kanban dinamicamente a partir dos valores reais de `etapa` presentes nos dados (não mais as 6 colunas fixas inventadas para o mockup); renderizado em layout horizontal com scroll (`overflow-x-auto`), sem drag-and-drop. Ver [backend.md](./backend.md) e [business-rules.md](./business-rules.md).
- **Agenda.tsx** (`/agenda`): array local `eventos` mockado; grid semanal (8 colunas: 1 de horas + 7 dias) construído com `date-fns` (`startOfWeek`, `addDays`, `addWeeks`, `subWeeks`); eventos posicionados com `position: absolute` calculado a partir de `top`/`height` em função de `HOUR_HEIGHT = 64`.
- **Vendas.tsx** (`/vendas`, novo em 2026-07-30): pedidos por item com pipeline de status em kanban (4 colunas, mesmo padrão visual do `Service.tsx`); estado local `vendas[]`, mas grava receitas no `FinanceiroContext` compartilhado ao aprovar um orçamento. Detalhes completos em [business-rules.md](./business-rules.md).
- **Configuracoes.tsx** (`/configuracoes`, novo em 2026-08-23): duas abas (Empresa, Integrações), estado 100% local, sem persistência. Detalhes completos em [business-rules.md](./business-rules.md).
- **Clientes.tsx** (`/clientes`), **Financeiro.tsx** (`/financeiro`) e **Equipe.tsx** (`/equipe`): existem e estão roteados; para Clientes, Financeiro, Vendas, Agenda, Configurações e Equipe, ver o detalhamento funcional atualizado em [business-rules.md](./business-rules.md).

## Build e tooling

- `vite.config.ts` integra `@vitejs/plugin-react` e `@tailwindcss/vite`.
- TypeScript dividido em `tsconfig.json` (raiz, referencia os outros dois), `tsconfig.app.json` (app) e `tsconfig.node.json` (build/config).
- ESLint usa o novo formato flat config (`eslint.config.js`), com `js.configs.recommended`, `tseslint.configs.recommended`, `reactHooks.configs.flat.recommended` e `reactRefresh.configs.vite`. Não há regras type-aware habilitadas (`recommendedTypeChecked`/`strictTypeChecked` estão comentadas no template padrão do Vite e não foram ativadas).

## Atualizações (2026-06-25)

Resolvido como parte do primeiro lote de execução do [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md):
- `axios`, `tailwindcss` e `@tailwindcss/vite` agora declarados em `aura-meu-negocio/package.json` (antes só resolvidos via `node_modules` da raiz do repositório).
- `baseURL` da API agora vem de `import.meta.env.VITE_API_URL` (`.env`/`.env.example`), com fallback `http://localhost:3000`.
- `src/services/api.ts` ganhou interceptors (injeção de `Authorization`, limpeza de sessão em `401`).
- Arquivos vazios removidos (`UseSidebar.tsx`, `PageContainer.tsx`, `SidebarLogo.tsx`).
- Sidebar consolidada em `components/Sidebar/Sidebar.tsx`; `SidebarItem.tsx`, `menuItems.ts` e `contexts/SidebarContext.tsx` foram removidos (não eram consumidos por nenhuma página).
- `src/contexts/AuthContext.tsx` criado (sessão centralizada); `Login.tsx` já o utiliza.
- Alias `@/` configurado em `tsconfig.app.json` + `vite.config.ts` (capacidade pronta, ainda não adotado nos imports existentes).

## Cursor em elementos clicáveis (`src/index.css`, novo em 2026-08-27)

`button:not(:disabled)`, `[role="button"]` e `input[type="checkbox"|"radio"]:not(:disabled)` ganharam `cursor: pointer` via uma regra global `:where(...)` (especificidade zero, para não sobrescrever um `cursor-default` explícito, como o de `PermissaoItem` em Equipe.tsx quando usado como badge somente-leitura). Antes disso nenhum `<button>` mostrava a mãozinha — o Tailwind parou de fazer isso por padrão desde a v3.3.

## Pendências

- Migrar os imports relativos (`../../components/...`) para o alias `@/` (configurado, mas não adotado ainda).
- Implementar de fato as rotas protegidas/guard de autenticação no frontend (o `AuthContext` já existe como fundação, o logout já funciona desde 2026-08-23, mas nenhuma rota ainda redireciona se não houver sessão) — mais urgente agora que `/clientes` e `/atendimento` batem em endpoints reais sem autenticação nenhuma (ver [backend.md](./backend.md)).
- `ClientesContext.addCliente`/`deletarCliente` (desde 2026-08-27) não tratam erro de forma alguma além de um `console.error` no delete — se a API cair no meio de uma sessão, a única sinalização visível ao usuário é a mensagem de erro dentro do `NovoClienteModal` ao criar; excluir falha silenciosamente (o item volta a aparecer só no próximo reload).
- **Este arquivo não recebeu uma reauditoria completa desde 2026-06-25** — foi corrigido pontualmente em 2026-07-30 (roteamento, contextos e a nova página Vendas), em 2026-08-23 (rota/página Configurações, contextos com `clienteId`/dados pessoais de cliente, logout) e em 2026-08-27 (Clientes/Atendimento com dados reais, porta do backend, cursor global). As seções sobre build/tooling e páginas de Auth abaixo ainda não foram reconferidas contra o código atual; `business-rules.md` e `changelog.md` são as fontes mais atualizadas.
