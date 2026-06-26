# Padrões de Código

Convenções extraídas por observação direta do código existente — não são regras impostas por linter além do que está configurado em `eslint.config.js`.

## TypeScript

- `function` components nomeados (`export function NomeDoComponente(...)`), não `const Componente = () => {}` nem `export default function`.
- Props sempre tipadas via `interface` (sufixo `Props`, ex.: `ButtonProps`, `InputProps`, `AuthCardProps`) ou `type` para tipos simples (ex.: `type ButtonVariant = "primary" | "secondary" | "ghost"`, `type Evento = {...}`).
- Componentes que estendem elementos HTML nativos usam `extends React.XHTMLAttributes<...>` + spread de `...props` (ver `Button`, `Input`).
- `children: ReactNode` é tipado explicitamente (não inferido via `React.FC`).
- Não há uso de `React.FC<Props>` em nenhum componente — todos usam a forma `function Componente({ prop }: Props)`.
- No backend, retorno de funções async não é tipado explicitamente (inferência do TS); erros são lançados com `throw new Error("mensagem em português")` e capturados nos controllers com `error instanceof Error ? error.message : "fallback"`.

## Nomenclatura

| Elemento | Convenção | Exemplos |
|---|---|---|
| Componentes React | PascalCase | `Button`, `DashboardLayout`, `SidebarItem` |
| Arquivos de componente | PascalCase, um componente por arquivo, mesmo nome do componente | `Button.tsx`, `AuthLayout.tsx` |
| Funções/handlers | camelCase, prefixo `handle` para event handlers | `handleLogin`, `handleResendCode`, `toggleSidebar` |
| Hooks customizados | prefixo `use` | `useSidebar` |
| Variáveis de domínio (negócio) | **português**, mesmo em código TypeScript | `usuario`, `senha`, `novaSenha`, `colunas`, `clientes`, `eventos`, `dia`, `hora` |
| Variáveis técnicas/genéricas | inglês | `loading`, `errors`, `isCollapsed`, `isOpen` |
| Rotas (paths) | português, kebab-case quando composta | `/recuperar-senha`, `/verificar-codigo`, `/atendimento` |
| Chaves de `localStorage` | prefixo `@aura:` | `@aura:token`, `@aura:user`, `@aura:reset-user` |
| Colunas de banco (Postgres) | snake_case | `empresa_id`, `usuario_id`, `created_at` |
| Campos em payloads JS/TS | camelCase | `empresaId` (mesmo quando vindo de `empresa_id` no banco — conversão manual feita no service) |

> Padrão observado: o domínio de negócio (campos de formulário, entidades) é nomeado em **português**; apenas conceitos técnicos genéricos (estado de UI, booleanos de controle) usam inglês. Manter essa convenção em código novo.

## Estilo de formatação

- Indentação majoritariamente com **tabs** em `src/components`, `src/pages/Auth`, `src/contexts`. Há inconsistência: trechos de `src/pages/Modules/Agenda.tsx` usam espaços. Não há Prettier configurado no projeto (sem `.prettierrc`) — a formatação depende apenas do editor do desenvolvedor.
- Quebra de linha frequente em JSX: atributos e expressões de `className` costumam ser quebrados em múltiplas linhas mesmo quando curtos (estilo verboso, "uma prop por linha" em vários componentes de `src/pages/Auth`).
- Aspas duplas (`"`) em strings/imports, consistente em todo o projeto (frontend e backend).
- Ponto e vírgula (`;`) usado consistentemente ao final das declarações.

## Estilização (JSX)

- Tailwind CSS para quase todo o styling; classes condicionais via template literal + ternário (`` `${condicao ? "a" : "b"}` ``), sem `clsx`/`classnames`/`tailwind-merge`.
- Cores de tema sempre via CSS variable dentro de classe arbitrária do Tailwind: `bg-[var(--primary)]`, `text-[var(--text-secondary)]`, nunca a cor hex diretamente em JSX.
- Cores de estado (erro, sucesso) usam paletas fixas do Tailwind (`red-500`, `green-700`, `blue-600`), não as CSS variables `--danger`/`--success`/`--warning` (que existem mas não são referenciadas em nenhum componente).

## Estrutura de imports

Ordem observada (não imposta por ESLint, mas consistente):
1. Bibliotecas externas (`react`, `react-router-dom`, `lucide-react`, `date-fns`).
2. Componentes internos (`../../components/...`), com caminho relativo (não há alias `@/`configurado em `tsconfig`/`vite.config`).
3. Services/contexts/utils internos.

## Backend — padrões específicos

- Cada módulo de feature segue sempre o trio `*.routes.ts` / `*.controller.ts` / `*.service.ts`.
- Controllers nunca contêm lógica de negócio ou SQL — apenas extraem `req.body`, chamam o service, e tratam o status HTTP de resposta/erro.
- Services lançam `Error` com mensagem em português pronta para ser exibida ao usuário final (os controllers não traduzem/mascaram essas mensagens).
- Todas as queries SQL usam parâmetros posicionais (`$1`, `$2`, ...) — nunca concatenação de string. Manter este padrão é importante para evitar SQL injection.
- Nomes de tabela e coluna em `snake_case`, mapeados manualmente para `camelCase` no retorno da API (não há um mapper genérico, é feito campo a campo).

## ESLint

Configuração em `eslint.config.js` (flat config), aplicada a `**/*.{ts,tsx}`:
- `js.configs.recommended`
- `tseslint.configs.recommended` (**não** a variante `recommendedTypeChecked`/`strictTypeChecked` — regras type-aware não estão habilitadas)
- `reactHooks.configs.flat.recommended`
- `reactRefresh.configs.vite`

Sem regras customizadas além das herdadas dos presets acima.

## Inconsistências/duplicações conhecidas (evitar replicar)

- `src/components/Card.tsx` e `src/components/PageHeader.tsx` duplicam `src/ui/Card.tsx` e `src/ui/PageHeader.tsx`.
- `src/components/Sidebar/Sidebar.tsx` (em uso) duplica a lista de menu já definida em `src/components/Sidebar/menuItems.ts` (não usada pelo componente ativo).
- `src/hooks/UseSidebar.tsx`, `src/components/Sidebar/SidebarLogo.tsx` e `src/components/PageContainer/PageContainer.tsx` estão vazios.
- `src/styles/theme.ts` (objeto JS) e `src/styles/globals.css` não são importados por nenhum arquivo ativo.

Ver detalhamento de cada caso em [frontend.md](./frontend.md) e [ui.md](./ui.md).

## Pendências

- Definir se o projeto adotará Prettier (ou config de formatação do ESLint) para eliminar a inconsistência tabs/espaços.
- Definir se haverá alias de import (`@/components/...`) para reduzir caminhos relativos longos (`../../components/...`).
- Decidir se as regras type-aware do `typescript-eslint` (`recommendedTypeChecked`) serão habilitadas.
- Confirmar se o padrão "nomes de domínio em português, técnicos em inglês" deve ser formalizado como guideline oficial do time.
