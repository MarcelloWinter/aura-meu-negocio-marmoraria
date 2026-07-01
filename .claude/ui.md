# Design System / UI

## Estilização

Abordagem híbrida:
- **Tailwind CSS** (`@import "tailwindcss"` em `src/index.css`, plugin `@tailwindcss/vite`) para a maioria das classes utilitárias de layout, espaçamento, tipografia.
- **CSS Variables** (`:root` em `src/index.css` e duplicadas em `src/styles/globals.css`) para cores de tema, consumidas via `bg-[var(--primary)]`, `text-[var(--text)]`, etc.
- `src/styles/theme.ts` define um objeto JS equivalente (`theme.colors`, `theme.radius`), mas **não é importado em nenhum componente** — hoje é código morto/duplicado em relação às CSS variables.

### Paleta de cores (CSS Variables)

| Variável | Valor | Uso |
|---|---|---|
| `--primary` | `#2563EB` (azul) | Cor de ação principal (botões primários, links, foco de inputs) |
| `--primary-hover` | `#1D4ED8` | Hover de elementos primários (definida mas pouco referenciada diretamente nas classes Tailwind) |
| `--background` | `#F8FAFC` | Fundo geral das telas |
| `--card` | `#FFFFFF` | Fundo de cards/painéis |
| `--text` | `#0F172A` | Texto principal |
| `--text-secondary` | `#64748B` | Texto secundário/descrições |
| `--border` | `#E2E8F0` | Bordas padrão |
| `--success` | `#16A34A` | (definida em `globals.css`, sem uso encontrado nos componentes atuais) |
| `--warning` | `#F59E0B` | (idem) |
| `--danger` | `#DC2626` | (idem — erros usam classes Tailwind fixas como `text-red-500`, não esta variável) |
| `--white` / `--black` | `#FFFFFF` / `#000000` | Definidas apenas em `index.css`, usadas no `Button` variante `secondary` |

**Observação**: `index.css` e `styles/globals.css` definem variáveis de cor parcialmente duplicadas (com pequenas divergências de quais variáveis existem em cada um). Apenas `index.css` é de fato importado pela aplicação (via `main.tsx`); `styles/globals.css` não tem nenhum import encontrado no código — parece não estar em uso.

### Tipografia

- Fonte: `Inter, system-ui, sans-serif` (definida no `body` em `index.css`).
- Tamanhos seguem a escala padrão do Tailwind (`text-sm`, `text-xl`, `text-3xl`, etc.), sem uma escala tipográfica customizada.

### Raio de borda

- Uso predominante de `rounded-xl`, `rounded-2xl`, `rounded-3xl` (classes Tailwind diretas), não as variáveis `--radius-*` definidas em `globals.css`.

## Inventário de componentes

### `src/ui/` — núcleo do design system

| Componente | Props | Descrição |
|---|---|---|
| `Card` | `children`, `className?` | Container com fundo branco, borda `slate-200`, `rounded-3xl`, sombra leve |
| `PageHeader` | `title`, `description?` | Título `h1` + descrição opcional, com margem inferior |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | *(novo em 2026-06-25)* Overlay centrado com card branco, header com título + botão de fechar (X), fecha ao clicar fora ou no X. Usado pelo primeiro formulário em modal do projeto (`NovoAgendamentoModal`, em Agenda) — é o padrão a reaproveitar para os próximos modais (ex.: cadastro de Cliente, Produto, etc.) |
| `Select` | `label`, `error?`, `options: {label, value}[]`, `placeholder?`, `value`, `onChange(value: string)`, `renderOption?` | *(criado em 2026-06-25, reescrito em 2026-06-30)* Dropdown **customizado** (não usa `<select>` nativo): botão trigger com chevron animado, lista de opções renderizada em `div`s com hover e item selecionado destacado, fecha ao clicar fora. Prop `renderOption(option)` permite conteúdo rico nas opções (ex.: pontos coloridos para serviços, avatares para profissionais) — o mesmo renderer é usado no trigger quando há valor selecionado. `onChange` recebe `string` diretamente (não `ChangeEvent`). |
| `Textarea` | `label`, `error?`, + atributos nativos de `<textarea>` | *(novo em 2026-06-25)* Mesma API visual do `Input`, para campos de texto longo (ex.: Observações) |

### `src/components/` — componentes compostos

| Componente | Props | Descrição |
|---|---|---|
| `Button` | `children`, `variant?: "primary" \| "secondary" \| "ghost"`, + todos os atributos nativos de `<button>` | 3 variantes de estilo; altura fixa `h-11`, largura `w-full` (use `className="!w-auto"` para botões de largura automática, ex.: rodapé de modal). *Corrigido em 2026-06-25*: a variante `secondary` tinha `border-[var(--white)]` (borda invisível em fundo branco) — corrigida para `border-[var(--border)]`. Padrão para botões "outline" fora do sistema de variantes (ex.: "Fechar horário" na Agenda): classes Tailwind diretas no elemento `<button>` (`border border-slate-300 bg-white hover:bg-slate-50 text-slate-700`). |
| `Input` | `label`, `error?`, + atributos nativos de `<input>` | Label + input + `FormError` associado; borda fica vermelha se houver erro |
| `FormError` | `message?` | Renderiza `null` se não houver mensagem; texto vermelho pequeno |
| `Card` | `children`, `className?` | **Duplicata** de `src/ui/Card.tsx` (implementação idêntica) |
| `PageHeader` | `title`, `description?` | **Duplicata** de `src/ui/PageHeader.tsx` (implementação idêntica) |
| `AuthCard` | `title`, `description`, `children` | Card centrado para telas de autenticação |
| `AuthLayout` | `children` | Envolve `Background` + `Logo` + conteúdo + rodapé de copyright |
| `Background` | `children` | Container de tela cheia centralizado, fundo `--background` |
| `Logo` | `centered?`, `size?: "xs"\|"sm"\|"md"\|"lg"`, `hideText?` | Logo "Aura Meu Negócio": quadrado azul com "A" + texto (texto pode ser escondido para sidebar colapsada) |
| `DashboardLayout` | `children` | Layout de página interna: Sidebar + Header + área de conteúdo scrollável; gerencia o próprio estado `sidebarOpen` |
| `Header/Header` | `onMenuClick` | Cabeçalho do dashboard: botão de menu, nome da empresa (hardcoded "Marmoraria Decore Granitos"), ícone de notificação, avatar com iniciais ("MW", hardcoded) |
| `Sidebar/Sidebar` | `isOpen`, `onClose` | Navegação lateral usada de fato pelo app; lista de menu hardcoded internamente |

> **Atualizado em 2026-06-25**: `Sidebar/SidebarItem.tsx`, `Sidebar/menuItems.ts`, `Sidebar/SidebarLogo.tsx`, `PageContainer/PageContainer.tsx` e `contexts/SidebarContext.tsx` foram removidos (não eram usados por nenhuma página) — `Sidebar/Sidebar.tsx` passou a ser a única implementação. `src/components/Card.tsx` e `src/components/PageHeader.tsx` também foram removidos; `src/ui/Card.tsx` e `src/ui/PageHeader.tsx` são agora a única fonte. Ver [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md).

### Convenções observadas nos componentes

- Todos function components, tipados com `interface`/`type` próprios (sufixo `Props` quando aplicável).
- Composição de `className` via template literals, com ternários para classes condicionais (não usa `clsx`/`cn`/`tailwind-merge`).
- Spread de atributos HTML nativos (`...props`) para permitir uso flexível (`Button`, `Input`).
- Ícones sempre via `lucide-react`, importados individualmente (`import { Bell, Menu } from "lucide-react"`).
- Indentação do projeto usa **tabs** (não espaços) na maioria dos arquivos de `src/components` e `src/pages`; alguns arquivos (ex.: trechos de `Agenda.tsx`) usam espaços — ver [coding-standards.md](./coding-standards.md).

## Pendências

- Decidir se `src/styles/theme.ts` e `src/styles/globals.css` devem ser removidos (não usados) ou se há intenção futura de usá-los como fonte única de tema (ex.: gerar as CSS variables a partir do `theme.ts`).
- Confirmar a paleta de cores "oficial" da marca (hoje só existe a paleta default usada no template, sem identidade visual customizada aplicada).
- Definir um padrão para variantes de estado (sucesso/erro/aviso) reutilizável — hoje cada página de Auth reimplementa manualmente os blocos de mensagem de sucesso/erro com classes Tailwind diretas, em vez de um componente `Alert`/`Banner` compartilhado.
