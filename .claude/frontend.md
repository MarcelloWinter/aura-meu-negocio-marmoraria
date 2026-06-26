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
├── contexts/                 # SidebarContext (único contexto global hoje)
├── hooks/                    # UseSidebar.tsx está vazio (hook real vive em SidebarContext.tsx)
├── pages/
│   ├── Auth/                 # Login, ForgotPassword, VerifyCode, ResetPassword
│   └── Modules/               # Service (Atendimento), Agenda
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
```

- Roteamento client-side via `BrowserRouter`/`Routes`/`Route` do `react-router-dom` v6.
- **Não existem rotas protegidas** (`ProtectedRoute`/`PrivateRoute`). Qualquer rota, incluindo `/atendimento` e `/agenda`, é acessível diretamente pela URL sem autenticação prévia.
- O `Sidebar.tsx` (usado dentro de `DashboardLayout`) referencia rotas que **não existem em `App.tsx`**: `/dashboard`, `/financeiro`, `/equipe`, `/configuracoes`. Clicar nesses itens de menu hoje não leva a nenhuma página implementada.

## Estado global

Único contexto existente: `src/contexts/SidebarContext.tsx`.

```ts
interface SidebarContextData {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}
```

- Provido por `SidebarProvider`, que envolve toda a árvore em `App.tsx`.
- Consumido pelo hook `useSidebar()`.
- **Atenção**: existe uma duplicação de implementação de sidebar (ver [coding-standards.md](./coding-standards.md) e [ui.md](./ui.md)) — o componente `Sidebar.tsx` realmente usado em `DashboardLayout.tsx` **não usa este contexto**; ele recebe `isOpen`/`onClose` via props e tem sua própria cópia hardcoded da lista de menu. O par `SidebarItem.tsx` + `menuItems.ts`, que sim usam `useSidebar()`, não é referenciado por nenhuma página atualmente.
- Não há contexto de autenticação, usuário logado, tema, ou dados de negócio (clientes, atendimentos, agendamentos) — esses dados hoje vivem como arrays locais dentro dos próprios componentes de página.

## Autenticação no frontend

- Login (`src/pages/Auth/Login.tsx`) chama `POST /auth/login`, recebe `{ token, usuario }` e grava em `localStorage`:
  - `@aura:token`
  - `@aura:user` (JSON do usuário)
- Fluxo de recuperação de senha usa chaves adicionais de `localStorage` como estado de sessão temporário entre páginas:
  - `@aura:reset-user` — usuário em processo de recuperação
  - `@aura:reset-user-id` — id retornado por `/auth/forgot-password` (quando presente)
  - `@aura:code-validated` — setado após validar o código de 6 dígitos; `ResetPassword.tsx` redireciona para `/` (login) no `useEffect` se essa flag não existir
- O token JWT **nunca é lido de volta** do `localStorage` para ser enviado em requisições futuras — não há interceptor do Axios adicionando `Authorization: Bearer <token>`.
- Não há lógica de logout, nem de expiração/refresh de token no cliente.

## Serviço HTTP (`src/services/api.ts`)

```ts
export const api = axios.create({
  baseURL: "http://localhost:3000",
});
```

- Instância única do Axios, sem interceptors.
- Cada página trata erros individualmente via `try/catch`, lendo `error?.response?.data?.message` com fallback para uma mensagem genérica em português.

## Páginas de autenticação (`src/pages/Auth`)

| Página | Rota | Endpoint(s) chamados | Observações |
|---|---|---|---|
| `Login.tsx` | `/` | `POST /auth/login` | Validação client-side simples (campos obrigatórios); navega para `/atendimento` no sucesso |
| `ForgotPassword.tsx` | `/recuperar-senha` | `POST /auth/forgot-password`, depois `POST /auth/send-reset-code` | Navega para `/verificar-codigo` |
| `VerifyCode.tsx` | `/verificar-codigo` | `POST /auth/verify-code`, com reenvio via `POST /auth/send-reset-code` | Código limitado a 6 dígitos numéricos (`replace(/\D/g, "")`) |
| `ResetPassword.tsx` | `/resetar-senha` | `POST /auth/reset-password` | Redireciona para `/` se `@aura:code-validated` não estiver setado; limpa as chaves de `localStorage` de reset ao concluir; redireciona para `/` após 3s |

## Páginas de módulos (`src/pages/Modules`)

Ver detalhamento de regras em [business-rules.md](./business-rules.md). Resumo técnico:

- **Service.tsx** (`/atendimento`): array local `colunas` com 6 estágios e clientes mockados; renderizado em layout horizontal com scroll (`overflow-x-auto`), sem drag-and-drop.
- **Agenda.tsx** (`/agenda`): array local `eventos` mockado; grid semanal (8 colunas: 1 de horas + 7 dias) construído com `date-fns` (`startOfWeek`, `addDays`, `addWeeks`, `subWeeks`); eventos posicionados com `position: absolute` calculado a partir de `top`/`height` em função de `HOUR_HEIGHT = 64`.

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

## Pendências

- Migrar os imports relativos (`../../components/...`) para o alias `@/` (configurado, mas não adotado ainda).
- Confirmar se as rotas `/dashboard`, `/financeiro`, `/equipe`, `/configuracoes` (presentes no menu da Sidebar) estão no roadmap de curto prazo.
- Implementar de fato as rotas protegidas/guard de autenticação no frontend (o `AuthContext` já existe como fundação, mas nenhuma rota ainda redireciona se não houver sessão).
