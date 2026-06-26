# ARCHITECTURE_PLAN.md

> **Status**: documento de referência oficial para a evolução arquitetural do "Aura Meu Negócio".
> **Última atualização**: 2026-06-25
> **Autor**: análise técnica automatizada sobre o estado real do código (commit `805fd16`).
> **Regra de ouro deste documento**: nada aqui implica em mudança de comportamento ou visual imediata. É um plano. Execução acontece em PRs pequenos e reversíveis, conforme a Etapa 8.

Este documento assume o papel de arquitetura de longo prazo para transformar o "Aura Meu Negócio" de um protótipo de 2 módulos (Atendimento, Agenda) com autenticação básica em um **SaaS multi-tenant com dezenas de módulos**, sem perder organização, performance ou velocidade de desenvolvimento ao longo do caminho.

Documentos relacionados (estado atual, não normativo): [CLAUDE.md](./CLAUDE.md), [architecture.md](./architecture.md), [frontend.md](./frontend.md), [backend.md](./backend.md), [database.md](./database.md), [business-rules.md](./business-rules.md), [ui.md](./ui.md), [coding-standards.md](./coding-standards.md), [roadmap.md](./roadmap.md), [changelog.md](./changelog.md). Conforme este plano for executado, esses documentos devem ser atualizados para refletir a nova realidade — eles descrevem o **estado atual**, este arquivo descreve o **estado alvo e o caminho**.

---

## Etapa 1 — Diagnóstico

### 1.1 Arquitetura atual

- **Frontend**: SPA React 19 + Vite, sem camada de estado de servidor (sem React Query/SWR), sem alias de import, sem code-splitting por rota. Roteamento simples e plano em um único `App.tsx`.
- **Backend**: Express 5 em 3 camadas (`routes → controller → service`), SQL puro via `pg`, sem repository layer, sem validação de schema, sem migrations versionadas, sem middleware de erro global.
- **Comunicação**: Axios com `baseURL` fixa (`http://localhost:3000`), sem interceptors, sem injeção automática de token.
- **Persistência de sessão**: `localStorage` cru, sem contexto de autenticação, sem leitura de token de volta para requisições.
- **Multi-tenancy**: existe `empresaId` no token e na tabela `usuarios`, mas **nenhuma rota de negócio aplica esse filtro** (porque ainda não há rotas de negócio).

Em resumo: a base é **funcional para um protótipo de 1 cliente**, mas tem zero das camadas que um SaaS multi-módulo, multi-tenant precisa para crescer sem reescrita.

### 1.2 Organização de pastas

- Frontend organizado **por tipo técnico** (`components/`, `pages/`, `services/`, `contexts/`), não por domínio/feature. Isso funciona bem até ~5 telas; com 15-20 módulos de negócio, `components/` e `pages/Modules/` vão virar gavetas de tudo, dificultando localizar o que pertence a qual módulo.
- Backend já organizado **por feature** (`modules/auth/...`), o que é o padrão certo — só falta replicar essa disciplina para os próximos módulos e adicionar as camadas que faltam (repository, validação).
- Existe uma pasta `package.json`/`node_modules` na **raiz do repositório**, fora de `aura-meu-negocio/` e `aura-meu-negocio-backend/`, com dependências (`react-hook-form`, `zod`, `tailwindcss`, `@hookform/resolvers`) que **não são usadas pelo app real**. Isso é ruído arquitetural — indica uma tentativa anterior de estrutura que foi abandonada a meio caminho, mas, curiosamente, aponta exatamente para o tipo de stack que este plano recomenda adotar formalmente (ver Etapa 2).

### 1.3 Organização dos módulos

- Frontend: apenas 2 módulos de negócio existem (`Service.tsx`, `Agenda.tsx`), cada um como **um único arquivo de página monolítico** contendo dados mockados, lógica de apresentação e JSX de layout inteiro misturados.
- Backend: apenas 1 módulo (`auth`). Não há ainda nenhum módulo de negócio no backend — Atendimento e Agenda existem **só no frontend**, como mocks.
- Não há um contrato definido de "o que é um módulo" (estrutura interna padrão) — cada novo módulo até agora foi criado ad-hoc.

### 1.4 Organização dos componentes

- Dois "design systems" paralelos e parcialmente duplicados: `src/ui/` (Card, PageHeader) e `src/components/` (cópias idênticas de Card e PageHeader, mais todo o resto). Não há critério documentado de o que vai em qual pasta.
- Componentes de layout (`DashboardLayout`, `Header`, `Sidebar`) misturam responsabilidade de **estrutura de página** com **dados de negócio hardcoded** (nome da empresa "Marmoraria Decore Granitos" e iniciais do avatar "MW" estão escritos diretamente no JSX do `Header`).
- Duas implementações de Sidebar coexistindo: `Sidebar.tsx` (em uso, com lista de menu hardcoded e prop `isOpen`) e o par `SidebarItem.tsx` + `menuItems.ts` + `SidebarContext` (não usado por nenhuma página). Isso é sintoma de uma refatoração que começou e não terminou.

### 1.5 Padrões existentes (positivos, vale preservar)

- Backend: separação `routes/controller/service` é limpa e consistente; uso de SQL parametrizado (sem SQL injection); convenção de erros (`throw new Error` em português, capturado no controller) é simples e previsível.
- Frontend: tipagem de props consistente via `interface`; convenção de nomenclatura de domínio em português / técnica em inglês é coerente em todo o código.
- ESLint flat config moderno, com hooks rules ativas.

### 1.6 Inconsistências

- `Sidebar.tsx` referencia rotas (`/dashboard`, `/financeiro`, `/equipe`, `/configuracoes`) que não existem em `App.tsx`.
- `styles/globals.css` e `styles/theme.ts` não são importados por nada — coexistem com `index.css`, que é a fonte real das CSS variables, com pequenas divergências entre os dois conjuntos de variáveis.
- Indentação inconsistente (tabs na maior parte, espaços em trechos de `Agenda.tsx`).
- A grade da Agenda renderiza 24 horas (0h-23h), mas a fórmula de posicionamento dos eventos assume que a grade começa às 8h (`(evento.hora - 8) * HOUR_HEIGHT`) — bug latente de cálculo.

### 1.7 Duplicação de código

- `Card` e `PageHeader` implementados de forma idêntica em `src/ui/` e `src/components/`.
- Lista de itens de menu duplicada entre `Sidebar.tsx` (hardcoded inline) e `menuItems.ts`.
- Cada página de autenticação (`Login`, `ForgotPassword`, `VerifyCode`, `ResetPassword`) reimplementa manualmente o bloco de mensagem de erro/sucesso (`<div className="rounded-xl border border-red-200 bg-red-50 p-3 ...">`) em vez de usar um componente `Alert`/`Banner` compartilhado.
- Cada página de auth também reimplementa manualmente seu próprio objeto de `errors` por campo e a lógica de "limpar erro ao digitar" — um padrão repetido 4x que pede um hook de formulário compartilhado.

### 1.8 Componentes grandes / responsabilidades misturadas

- `Service.tsx` (Atendimento): mistura dados (array de colunas/clientes hardcoded), regra de apresentação (cálculo de iniciais do avatar) e o JSX completo do Kanban em ~220 linhas, em um único arquivo de página. Não há separação entre "página" (rota) e "componente de pipeline" reutilizável.
- `Agenda.tsx`: mesmo padrão — dados mockados, cálculo de grid, lógica de posicionamento e JSX tudo em um arquivo de ~225 linhas.
- `Sidebar.tsx`: mistura estrutura visual, lista de dados de navegação e lógica de responsividade (mobile overlay) em um único componente.
- Backend `auth.service.ts`: mistura regra de negócio (validar usuário ativo, validar senha) com acesso a dados (SQL direto) — não há nada isolando "o que é regra" de "como buscar no Postgres", o que vai dificultar testar regra de negócio sem banco real conforme mais módulos forem adicionados.

### 1.9 Problemas de escalabilidade

- Sem camada de repository no backend → qualquer troca de banco, adição de cache, ou teste unitário de regra de negócio exige tocar SQL misturado com lógica.
- Sem padrão de módulo no frontend → cada novo módulo (dos ~17 módulos do roadmap do SaaS) corre o risco de reinventar sua própria estrutura interna.
- `baseURL` do Axios fixa em código → impossível ter ambientes (dev/staging/produção) sem editar código-fonte.
- Nenhuma rota lazy-loaded → conforme o número de módulos crescer, o bundle inicial do frontend vai crescer proporcionalmente, sem code-splitting.
- Nenhuma abstração de "tenant" (empresa) no frontend nem enforcement centralizado no backend → cada novo endpoint de negócio terá que reimplementar manualmente o filtro por `empresa_id`, com alto risco de esquecimento (vazamento de dados entre tenants).

### 1.10 Problemas de reutilização

- Não há `DataTable`, `Modal`, `Drawer`, `Select`, `DatePicker`, `Form` genéricos — qualquer tela de listagem/cadastro futura (Clientes, Produtos, Estoque, Equipe...) vai precisar ser construída do zero ou copiando/colando padrões do Atendimento/Agenda.
- O Kanban do Atendimento e o Calendário da Agenda são, estruturalmente, casos específicos de padrões genéricos (`Kanban<T>`, `Calendar<T>`) que hoje estão completamente acoplados aos dados mockados de cada tela — não há como reaproveitar esse layout para outro domínio (ex.: um Kanban de oportunidades de CRM) sem duplicar todo o componente.

### 1.11 Problemas de tipagem

- `SidebarItem.tsx`: prop `icon: any` — perde completamente a tipagem do componente de ícone.
- Tratamento de erro de API tipado como `error: any` em todas as páginas de autenticação (`catch (error: any)`), perdendo a verificação de tipo no acesso a `error.response.data.message`.
- Backend: `req.body` desestruturado sem validação de schema (zod está instalado mas não é usado) — `req: Request` não tem tipos para o corpo esperado, então erros de payload só aparecem em runtime.
- Não há tipos compartilhados entre frontend e backend (ex.: o shape de `usuario` retornado pelo login é duplicado mentalmente em ambos os lados, sem um contrato único).

### 1.12 Problemas de estado

- Não existe um conceito de "sessão atual" no frontend — `localStorage` é lido/escrito diretamente em cada página, sem um `AuthContext`/store central. Isso significa que não há como, por exemplo, reagir a logout em outra aba, nem exibir o usuário logado no `Header` (hoje hardcoded).
- Não há cache nem estado de servidor — toda tela futura que buscar dados reais do backend vai precisar reimplementar manualmente loading/error/refetch, em vez de usar uma camada de data-fetching compartilhada.
- O único contexto existente (`SidebarContext`) não é usado pelo componente de Sidebar realmente ativo — ou seja, na prática, **zero estado global está em uso efetivo** hoje.

### 1.13 Problemas de UI

- Nome da empresa e iniciais do usuário hardcoded no `Header` — qualquer outro tenant/empresa veria os mesmos dados fixos.
- Paleta de cores de status (`--success`, `--warning`, `--danger`) definida mas não usada — componentes de feedback usam classes Tailwind fixas (`red-500`, `green-700`) em vez do tema, o que vai dificultar dar suporte a tema claro/escuro ou white-label no futuro.
- Sem `EmptyState` padronizado — não há nenhuma tela hoje que trate o caso "lista vazia" (ainda não é visível porque tudo é mockado com dados sempre presentes).

### 1.14 Problemas de responsividade

- `Sidebar.tsx` tem lógica de responsividade (overlay mobile, colapso) implementada ad-hoc dentro do próprio componente de menu, sem um breakpoint/hook compartilhado (`useMediaQuery` ou similar) — qualquer outro componente que precise saber "estou no mobile?" vai duplicar essa lógica.
- O grid da Agenda tem `min-w-[900px]`, ou seja, **força scroll horizontal em qualquer tela menor que 900px** — não há uma versão mobile real do calendário (ex.: visualização de lista/dia único).
- O Kanban do Atendimento (`min-w-max` + colunas de `360px`) tem o mesmo problema: em mobile, vira um carrossel horizontal sem nenhuma adaptação de densidade de informação.

### 1.15 Problemas de performance

- Hoje não há dados reais suficientes para gerar problema de performance perceptível, mas a arquitetura atual **não tem nenhuma defesa preparada**: sem paginação, sem virtualização de listas, sem memoização em listas (`colunas.map`/`eventos.filter` recalculados a cada render), sem code-splitting de rotas.
- Sem cache de requisições (cada navegação para uma tela vai refazer a chamada de API do zero, mesmo sem necessidade).

### 1.16 Problemas de experiência do desenvolvedor (DX)

- Sem alias de import → caminhos relativos do tipo `../../components/...` vão piorar conforme a árvore de módulos crescer.
- Sem Prettier → inconsistência de formatação já visível (tabs vs espaços).
- Sem testes automatizados (nenhum framework de teste configurado em nenhum dos dois pacotes).
- Sem CI configurado (nenhum workflow do GitHub Actions ou equivalente).
- Sem documentação de setup de ambiente local além do `README.md` padrão do template Vite.
- Sem `.env.example` no backend (variáveis de ambiente só existem documentadas neste `.claude/`, não no próprio repositório de forma versionada).

---

## Etapa 2 — Arquitetura alvo

### 2.1 Princípios orientadores

1. **Modular por domínio, não por tipo técnico.** Cada módulo de negócio (Clientes, Financeiro, Estoque...) é uma unidade autocontida: tem seus próprios componentes, hooks, services e tipos. Isso é o princípio "feature-based" / "package by feature", e é o que permite adicionar o módulo nº 20 com o mesmo custo cognitivo do módulo nº 3.
2. **Design system separado de features.** Nada de domínio (nome de cliente, status de atendimento) entra nos componentes genéricos de UI. Um `DataTable` não sabe o que é um "Cliente"; ele recebe colunas e linhas.
3. **Clean Architecture / camadas explícitas no backend.** `routes (HTTP) → controller (orquestração) → service (regra de negócio) → repository (acesso a dados)`. Regra de negócio nunca depende diretamente de `pg`; depende de uma interface de repositório.
4. **DDD-lite onde faz sentido.** Não vamos introduzir Agregados/Value Objects formais para um sistema deste tamanho, mas vamos sim adotar a linguagem ubíqua (os nomes de domínio em português já usados — `atendimento`, `agendamento`, `empresa` — devem virar tipos/entidades explícitas, não apenas nomes de variável) e respeitar limites de módulo (um módulo não acessa a tabela de outro módulo diretamente — passa por uma service/API pública do módulo dono).
5. **Estado de servidor ≠ estado de UI.** Dados que vêm da API (clientes, atendimentos, agendamentos) são gerenciados por uma camada de data-fetching com cache (React Query), nunca copiados para um `useState` solto. Estado de UI local (modal aberto, aba ativa, sidebar colapsada) continua em `useState`/Context, simples.
6. **Multi-tenant por padrão, não por exceção.** Todo dado de negócio é escopado por `empresa_id` desde a primeira linha de código de cada módulo — nunca como um patch posterior.
7. **Tudo que pode ser configurável, é configurável.** URLs de API, feature flags, tema, idioma — nunca hardcoded.

### 2.2 Stack alvo (frontend)

| Camada | Hoje | Alvo | Justificativa |
|---|---|---|---|
| Estado de servidor | nenhum (fetch manual por página) | **TanStack Query (React Query)** | cache, retry, invalidação, loading/error padronizados — essencial com dezenas de telas de listagem/CRUD |
| Formulários | `useState` manual por campo | **react-hook-form + zod** (`@hookform/resolvers`) | já estavam instalados no `package.json` da raiz — formaliza o que já era a intenção; reduz boilerplate repetido em todas as páginas de Auth e nos futuros CRUDs |
| Estado de UI cross-cutting | Context isolado (subutilizado) | **Context para Auth/Tenant/Theme** (baixa frequência de mudança) + manter `useState` local para tudo o que é específico de uma tela | Context é suficiente para esse volume de estado global; evita a complexidade de uma lib extra (Redux/Zustand) sem necessidade real ainda |
| HTTP client | Axios instância única, sem interceptors | Axios com **interceptors** (injeção de token, tratamento de 401, `baseURL` por variável de ambiente) + um client por módulo (`modules/clientes/services/clientesApi.ts`) que reusa a instância base | centraliza autenticação/erros, mantém cada módulo dono de suas próprias chamadas |
| Validação | nenhuma no client (exceto checagem manual de campos vazios) | **zod schemas compartilhados** entre formulário (react-hook-form) e, idealmente, espelhando os schemas do backend | uma única fonte de verdade do "formato válido" de cada entidade |
| Roteamento | rotas síncronas, planas, sem guard | **rotas por módulo, lazy-loaded (`React.lazy`)**, com guard de autenticação e de permissão | performance (bundle menor por rota) + segurança (rotas protegidas de fato) |
| i18n | nenhum (strings em português direto no JSX) | **react-i18next**, com `pt-BR` como único locale inicial, mas todas as strings já passando pela camada de tradução | evita uma migração dolorosa depois; custo de adoção inicial é baixo se feito desde já |
| Tema | CSS variables fixas | mesmas CSS variables, mas com **dois conjuntos (`light`/`dark`)** e ganchos para white-label (variáveis sobrescrevíveis por tenant) | já usamos CSS variables — é só formalizar mais de um conjunto de valores |

### 2.3 Stack alvo (backend)

| Camada | Hoje | Alvo | Justificativa |
|---|---|---|---|
| Validação de entrada | nenhuma | **zod** (já instalado) em cada rota, schema por módulo | falha rápido e com mensagem clara antes de chegar à regra de negócio |
| Acesso a dados | SQL direto no service | **Repository pattern** (`*.repository.ts`) por módulo — query builder leve (ex.: `pg` com helpers próprios, ou adoção futura de **Drizzle ORM**, que é type-safe e próximo de SQL puro, sem o overhead de um ORM completo) | isola regra de negócio de detalhes de SQL; testável com repositório fake |
| Schema do banco | implícito, sem migrations | **migrations versionadas** (`node-pg-migrate` ou as migrations nativas do Drizzle) | rastreabilidade, reprodutibilidade entre ambientes |
| Autenticação | JWT emitido, nunca validado | **middleware `authenticate`** (verifica JWT, popula `req.user = { id, empresaId, roles }`) aplicado a todas as rotas exceto `auth/*` públicas | pré-requisito para qualquer módulo de negócio novo |
| Autorização | inexistente | **middleware `authorize(permissions[])`** baseado em RBAC simples (roles → permissions) | necessário assim que houver mais de um perfil de usuário (ex.: admin da empresa vs. atendente) |
| Multi-tenancy | `empresaId` no token, sem enforcement | **escopo automático por tenant**: o repository base sempre recebe `empresaId` e o aplica em toda query (`WHERE empresa_id = $1`); avaliar **Row Level Security (RLS)** do Postgres como camada extra de defesa | elimina a classe de bug "esqueci o filtro de empresa" |
| Erros | tratamento ad-hoc por controller | **middleware de erro global** + classe `AppError` (com `statusCode`, `message`, `code`) | resposta de erro consistente em toda a API |
| Logs | `console.log`/`console.error` | **logger estruturado** (ex.: `pino`) | pré-requisito para observabilidade (Etapa 3/Fase 6) |

### 2.4 Padrão de módulo (contrato único)

Todo módulo de negócio — frontend e backend — segue o mesmo esqueleto, para que qualquer desenvolvedor saiba exatamente onde procurar/colocar código, independentemente do módulo.

**Frontend** (`src/modules/<modulo>/`):
```
<modulo>/
├── pages/          # componentes de rota (ex.: ListaClientesPage, ClienteDetalhePage)
├── components/      # componentes específicos deste módulo (não reutilizáveis fora dele)
├── hooks/            # hooks específicos (ex.: useClientes, useClienteForm)
├── services/          # chamadas de API deste módulo (ex.: clientesApi.ts)
├── types.ts            # tipos/entidades do módulo
├── routes.tsx           # definição das rotas deste módulo (registrada no router central)
└── index.ts              # API pública do módulo (o que outros módulos podem importar)
```

**Backend** (`src/modules/<modulo>/`):
```
<modulo>/
├── <modulo>.routes.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts        # regra de negócio
├── <modulo>.repository.ts       # acesso a dados
├── <modulo>.schema.ts             # validação zod de entrada
└── <modulo>.types.ts
```

Um módulo só pode importar de outro módulo através do seu `index.ts`/API pública — nunca importando um arquivo interno de outro módulo diretamente. Isso preserva os limites mesmo com dezenas de módulos.

---

## Etapa 3 — Roadmap arquitetural (ordem de execução)

A ordem foi pensada para que **cada fase resolva o bloqueador da fase seguinte**, sem nunca quebrar o sistema em produção.

### Fase 1 — Reorganizar estrutura e eliminar duplicações
- Unificar `Card`/`PageHeader` em um único lugar (`src/ui` vira a fonte da verdade).
- Resolver a duplicação de Sidebar (escolher uma implementação, remover a outra).
- Remover arquivos vazios (`UseSidebar.tsx`, `SidebarLogo.tsx`, `PageContainer.tsx`, `auth.middleware.ts` fica, mas será implementado na Fase 2).
- Esclarecer/remover o `package.json` da raiz do repositório.
- Introduzir a pasta `modules/` no frontend e mover `Service.tsx`/`Agenda.tsx` para dentro do novo padrão (`modules/atendimento`, `modules/agenda`), sem alterar comportamento.
- Configurar Prettier + alias de import (`@/`).

### Fase 2 — Padronizar hooks, services e API
- Implementar o `authenticate` middleware no backend e aplicá-lo a rotas futuras (sem quebrar `auth/*`, que continua público).
- Criar a instância Axios com interceptors (token automático, tratamento de 401) e `baseURL` via variável de ambiente.
- Introduzir `AuthContext` no frontend (sessão atual, login/logout), substituindo a leitura solta de `localStorage` em cada página.
- Introduzir TanStack Query e migrar o data-fetching das páginas de Auth para o novo client padronizado (mesmo comportamento, código mais consistente).
- Introduzir react-hook-form + zod nos formulários de Auth (mesmo comportamento visual, menos boilerplate).
- Backend: introduzir a camada de repository no módulo `auth` (sem mudar comportamento), como modelo para os próximos módulos.

### Fase 3 — Construir o design system compartilhado
- Implementar os componentes globais definidos na Etapa 5 (`DataTable`, `Modal`, `Drawer`, `Select`, `DatePicker`, `Form`, `EmptyState`, `Alert`, etc.), inicialmente sem consumidores reais — validados via Storybook ou uma página de showcase interna.
- Migrar os blocos de erro/sucesso das páginas de Auth para o novo `Alert`.
- Generalizar o Kanban do Atendimento e o Calendário da Agenda em componentes reutilizáveis (`Kanban<T>`, `WeekCalendar<T>`), mantendo o visual atual idêntico.

### Fase 4 — Multi-tenancy e permissões
- Aplicar o escopo por `empresa_id` de forma centralizada no repository base do backend.
- Implementar RBAC simples (roles/permissions) e o middleware `authorize`.
- Implementar rotas protegidas no frontend (route guard + redirecionamento) e um sistema de "permission gate" (`<RequirePermission perm="clientes.view">`) para esconder/bloquear UI por papel.

### Fase 5 — Primeiro módulo de negócio real ponta a ponta (referência)
- Escolher **um** módulo simples (sugestão: **Clientes**) e implementá-lo de ponta a ponta (backend com repository+migrations, frontend com módulo completo, DataTable, formulário, paginação) seguindo 100% o padrão definido nas Etapas 2 e 4. Esse módulo se torna o **template oficial** para todos os próximos.

### Fase 6 — Replicar o padrão para os demais módulos
- Dashboard, Financeiro, Estoque, Produtos, Serviços, Equipe, CRM, Marketing, Configurações, Integrações, Relatórios, IA, Automações — cada um seguindo o template da Fase 5, em ordem de prioridade de negócio (não arquitetural — a arquitetura já suporta qualquer ordem a partir daqui).

### Fase 7 — Performance
- Code-splitting por rota/módulo (`React.lazy` + `Suspense`).
- Paginação e/ou virtualização em todas as listagens (`DataTable`).
- Memoização onde fizer sentido (listas grandes, cálculos de grid da Agenda/Kanban).
- Auditoria de bundle size.

### Fase 8 — Responsividade e tema
- Hook `useMediaQuery`/breakpoints compartilhado.
- Versões mobile reais do Kanban (lista vertical) e da Agenda (visão dia único).
- Tema claro/escuro via CSS variables com dois conjuntos de valores + toggle persistido.
- Bases para white-label (variáveis de marca sobrescrevíveis por tenant: logo, cor primária).

### Fase 9 — Internacionalização
- Introdução do react-i18next, extração de todas as strings visíveis para arquivos de tradução, mesmo mantendo só `pt-BR` no início.

### Fase 10 — Testes
- Testes unitários de regra de negócio no backend (services, com repository fake).
- Testes de componentes críticos no frontend (Vitest + React Testing Library) — design system primeiro, módulos depois.
- Testes E2E dos fluxos críticos (login, recuperação de senha, CRUD de um módulo) com Playwright.

### Fase 11 — Observabilidade
- Logger estruturado no backend (pino), com correlação de request id.
- Tratamento de erro global + captura de exceções (ex.: Sentry) em ambos os pacotes.
- Métricas básicas de uso por módulo (mesmo que rudimentares no início).

### Fase 12 — CI/CD e qualidade contínua
- Pipeline (GitHub Actions): lint + typecheck + testes + build em todo PR.
- Preview deploys (se a infraestrutura em Easypanel permitir).
- Checagem automática de tamanho de bundle/regressão de performance.

> Observação: Fases 7 a 12 podem rodar **em paralelo** entre si após a Fase 6 estar de pé — a ordem 7→12 é uma sugestão de prioridade, não uma dependência estrita como 1→6.

---

## Etapa 4 — Estrutura definitiva de diretórios

### 4.1 Frontend (`aura-meu-negocio/src/`)

```
src/
├── app/
│   ├── App.tsx                     # composição raiz: providers + router
│   ├── router.tsx                   # registro central de rotas (agrega routes.tsx de cada módulo)
│   └── providers/
│       ├── AppProviders.tsx          # compõe todos os providers abaixo
│       ├── QueryProvider.tsx          # TanStack Query client
│       ├── AuthProvider.tsx            # sessão, login/logout, usuário atual
│       ├── TenantProvider.tsx           # empresa atual, branding white-label
│       └── ThemeProvider.tsx             # tema claro/escuro
│
├── modules/                          # um diretório por módulo de negócio (ver Etapa 2.4)
│   ├── auth/
│   ├── dashboard/
│   ├── atendimento/
│   ├── agenda/
│   ├── clientes/
│   ├── financeiro/
│   ├── estoque/
│   ├── produtos/
│   ├── servicos/
│   ├── equipe/
│   ├── crm/
│   ├── marketing/
│   ├── configuracoes/
│   ├── permissoes/
│   ├── integracoes/
│   ├── relatorios/
│   ├── ia/
│   └── automacoes/
│
├── ui/                                 # design system — só componentes "burros", sem regra de negócio
│   ├── components/
│   │   ├── layout/                       # Sidebar, Header, DashboardLayout, AuthLayout, PageContainer, PageHeader
│   │   ├── data-display/                  # DataTable, Card, Badge, EmptyState, Avatar, Tag
│   │   ├── feedback/                       # Alert, Toast, Spinner/Loading, Skeleton
│   │   ├── overlay/                         # Modal, Drawer, Popover, Tooltip, ConfirmDialog
│   │   ├── navigation/                       # Tabs, Breadcrumbs, Pagination
│   │   └── form/                              # Form, Input, Select, Textarea, Checkbox, Radio, Switch, DatePicker, Upload, SearchInput
│   ├── patterns/                          # composições genéricas reutilizáveis entre módulos
│   │   ├── Kanban/                          # generalização do board de Atendimento
│   │   ├── Calendar/                         # generalização da Agenda
│   │   └── Filters/                           # barra de filtros genérica
│   └── tokens/                             # cores, espaçamento, tipografia (fonte única, ver 4.3)
│
├── shared/                              # utilidades técnicas cross-module, sem UI
│   ├── hooks/                              # useDebounce, useMediaQuery, usePagination, usePermission...
│   ├── lib/
│   │   ├── http/                             # instância Axios + interceptors
│   │   ├── query/                              # helpers de chave de cache do React Query
│   │   ├── validation/                          # schemas zod compartilhados (ex.: paginação, ids)
│   │   └── formatters/                           # datas, moeda, telefone (pt-BR)
│   ├── types/                               # tipos genéricos (Paginated<T>, ApiError, etc.)
│   └── constants/                             # rotas públicas, enums compartilhados
│
├── i18n/                                  # configuração e dicionários de tradução
│   └── locales/pt-BR/...
│
├── config/                                  # leitura tipada de variáveis de ambiente, feature flags
│
├── assets/
├── index.css                                  # ponto único das CSS variables/tokens (ver 4.3)
└── main.tsx
```

Notas de migração para esta estrutura:
- `contexts/` deixa de existir como pasta solta — vira `app/providers/`.
- `services/api.ts` deixa de existir isolado — vira `shared/lib/http/`.
- `styles/` deixa de existir como pasta — `theme.ts` e `globals.css` são absorvidos por `ui/tokens/` e `index.css` (fonte única).
- `components/` e `ui/` atuais se fundem em `ui/components/` (categorizados), eliminando a duplicação.

### 4.2 Backend (`aura-meu-negocio-backend/aura-meu-negocio-backend/src/`)

```
src/
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── atendimento/
│   ├── agenda/
│   ├── clientes/
│   ├── financeiro/
│   ├── estoque/
│   ├── produtos/
│   ├── servicos/
│   ├── equipe/
│   ├── crm/
│   ├── marketing/
│   ├── configuracoes/
│   ├── permissoes/
│   ├── integracoes/
│   ├── relatorios/
│   ├── ia/
│   └── automacoes/
│       └── (cada um com .routes/.controller/.service/.repository/.schema/.types — ver 2.4)
│
├── shared/
│   ├── middlewares/
│   │   ├── authenticate.ts                # valida JWT, popula req.user
│   │   ├── authorize.ts                     # valida permissões (RBAC)
│   │   ├── tenant-scope.ts                    # garante empresaId em todas as queries
│   │   ├── error-handler.ts                     # middleware de erro global
│   │   └── validate.ts                            # valida req.body/query/params com zod
│   ├── errors/
│   │   └── AppError.ts                         # erro de domínio com statusCode/code
│   ├── lib/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── pagination.ts
│   │   └── logger.ts                              # pino
│   └── types/
│       └── express.d.ts                          # augment de Request (req.user, req.empresaId)
│
├── config/
│   ├── database.ts
│   └── env.ts                                       # leitura tipada/validada das variáveis de ambiente
│
├── database/
│   ├── migrations/                                    # node-pg-migrate ou Drizzle
│   └── seeds/
│
├── app.ts
└── server.ts
```

### 4.3 Fonte única de tema (frontend)

`src/ui/tokens/` define os valores; `src/index.css` apenas declara as CSS variables a partir desses tokens (idealmente gerado, ou ao menos mantido manualmente em um único lugar). `theme.ts` (objeto JS) e `globals.css` (hoje órfãos) são descontinuados nesta migração — um único conjunto de tokens, consumido tanto pelo CSS quanto, se necessário, por lógica JS (ex.: cores passadas para um gráfico).

---

## Etapa 5 — Componentização (design system global)

Critério de "global": o componente não conhece nenhuma entidade de negócio (Cliente, Atendimento, Produto...) — só recebe dados via props.

### Layout
- `DashboardLayout`, `AuthLayout`, `PageContainer`, `PageHeader`, `Sidebar`, `Header`, `Breadcrumbs`

### Data display
- `DataTable` (ordenação, paginação, seleção de linhas, ações por linha, estado vazio integrado) — o componente mais reutilizado do sistema; toda listagem de todo módulo passa por ele.
- `Card`, `Badge`/`Tag`, `Avatar`, `EmptyState`, `Stat`/`KpiCard` (para Dashboard/Relatórios)

### Feedback
- `Alert`/`Banner` (substitui os blocos de erro/sucesso hoje copiados em cada página de Auth)
- `Toast`/`Notification` (feedback assíncrono de ações)
- `Loading`/`Spinner`, `Skeleton`

### Overlay
- `Modal`, `Drawer`, `Popover`, `Tooltip`, `ConfirmDialog` (confirmação de exclusão/ação destrutiva — padrão único em todo o sistema)

### Navegação
- `Tabs`, `Pagination`, `Stepper` (útil para fluxos como o de recuperação de senha, hoje implementado como páginas separadas sem indicação visual de progresso)

### Formulário
- `Form` (wrapper de `react-hook-form` + zod, padroniza submit/erro)
- `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `DatePicker`, `Upload`, `SearchInput`, `FormError` (já existe, mantém)

### Padrões compostos (domain-agnostic, mas mais complexos que um átomo de UI)
- `Kanban<T>` — generalização do board de Atendimento: colunas, cards, contagem por coluna, configuráveis via props; quem usa decide o que é uma "coluna" e um "card".
- `Calendar`/`WeekCalendar<T>` — generalização da Agenda: grade de horas/dias, eventos posicionados, configurável (horário de início/fim, granularidade).
- `Filters`/`FilterBar` — barra de filtros reutilizável para listagens (texto, intervalo de data, select múltiplo).

### Regra de governança
Nenhum componente dentro de `src/ui/` pode importar de `src/modules/*`. A dependência é sempre `modules → ui`, nunca o contrário. Isso é o que garante que o design system permaneça genérico mesmo com 20 módulos consumindo-o.

---

## Etapa 6 — Como esta arquitetura escala

- **Novos módulos**: seguem o template da Etapa 2.4. Custo de adicionar o módulo nº 20 é o mesmo do módulo nº 5 — não há acoplamento cruzado entre módulos (só via API pública/`index.ts`).
- **Novos desenvolvedores**: a estrutura por domínio significa que um dev alocado em "Financeiro" só precisa entender `modules/financeiro/` + o design system (`ui/`) — não precisa ler o módulo de Agenda para trabalhar no de Financeiro.
- **Manutenção**: bugs ficam contidos dentro do módulo onde ocorrem (graças aos limites de import); componentes de UI corrigidos uma vez em `ui/` beneficiam todos os módulos automaticamente.
- **Testes**: a separação `service`/`repository` no backend permite testar regra de negócio com um repositório fake, sem banco real; no frontend, o design system isolado (sem regra de negócio) é trivialmente testável com testes de componente puro.
- **Integração com APIs**: cada módulo tem seu próprio arquivo de `services/`/`*.api.ts` — integrar uma API externa nova (ex.: gateway de pagamento no Financeiro) fica contido nesse módulo, sem tocar a instância HTTP global além de, no máximo, adicionar um interceptor.
- **Autenticação**: centralizada em `AuthProvider` (frontend) e `authenticate` middleware (backend) — qualquer módulo novo "ganha" autenticação automaticamente ao registrar suas rotas sob o middleware, sem reimplementar nada.
- **Permissões**: o middleware `authorize` (backend) e o componente `RequirePermission` (frontend) são genéricos — um módulo novo só declara quais permissões suas rotas/telas exigem.
- **Multi-tenancy**: o escopo por `empresa_id` vive no repository base e no `TenantProvider` — todo módulo novo herda o isolamento de tenant automaticamente, sem precisar "lembrar" de filtrar manualmente.
- **Internacionalização**: como toda string passa por `i18n/`desde o início, adicionar um segundo idioma no futuro é um trabalho de tradução, não de refatoração de código.
- **Tema claro/escuro**: como cores são sempre CSS variables (nunca hex direto), alternar tema é trocar o conjunto de valores das variáveis — nenhum componente precisa saber em qual tema está.
- **White-label**: pela mesma razão (tokens centralizados + `TenantProvider`), sobrescrever logo/cor primária por cliente é uma extensão natural do mesmo mecanismo de tema.
- **Responsividade**: hooks compartilhados (`useMediaQuery`) e os padrões `Kanban`/`Calendar` já desenhados para aceitar variação de layout por breakpoint evitam que cada módulo reimplemente sua própria lógica de mobile.

---

## Etapa 7 — Melhorias futuras (priorizadas)

### Alta prioridade
- Implementar middleware de autenticação (`authenticate`) no backend.
- Implementar rotas protegidas no frontend.
- Introduzir interceptor de Axios (token automático + tratamento de 401).
- Resolver duplicações de componentes (`Card`/`PageHeader`) e de Sidebar.
- Tornar a `baseURL` da API configurável por ambiente.
- Implementar enforcement de multi-tenancy (`empresa_id`) antes do primeiro módulo de negócio real ir ao ar.
- Adicionar validação de payload (zod) em todas as rotas do backend.
- Versionar o schema do banco (migrations).

### Média prioridade
- Construir o design system (`DataTable`, `Modal`, `Drawer`, `Form`, etc.) antes de iniciar o segundo módulo de negócio real.
- Generalizar Kanban e Calendar como padrões reutilizáveis.
- Introduzir TanStack Query.
- Introduzir RBAC (roles/permissions).
- Code-splitting por rota.
- Logger estruturado + middleware de erro global no backend.
- Corrigir o bug de posicionamento de eventos na Agenda.
- Configurar Prettier + alias de import.

### Baixa prioridade
- Internacionalização completa (mais de um idioma).
- Tema claro/escuro.
- White-label.
- Testes E2E.
- Observabilidade avançada (tracing distribuído, dashboards de métricas).
- CI/CD com preview deploys.

---

## Etapa 8 — Plano de migração (passos pequenos e reversíveis)

Cada passo abaixo é independente, mantém o sistema funcionando ao final, e pode ser um PR isolado. A ordem segue a Etapa 3, detalhada em incrementos menores.

1. Criar `.prettierrc` + rodar formatação automática (sem mudar lógica) — risco zero.
2. Configurar alias `@/` no `tsconfig`/`vite.config.ts` — sem mover nenhum arquivo ainda.
3. Apagar arquivos vazios sem uso (`UseSidebar.tsx`, `SidebarLogo.tsx`, `PageContainer.tsx`).
4. Remover a cópia duplicada (`src/components/Card.tsx`, `src/components/PageHeader.tsx`), redirecionando os imports remanescentes (hoje nenhuma página os usa, então o risco é mínimo) para `src/ui/`.
5. Escolher e consolidar uma única implementação de Sidebar; apagar a outra (`menuItems.ts`/`SidebarItem.tsx` ou o conteúdo hardcoded de `Sidebar.tsx`, unificando em uma fonte só).
6. Investigar e decidir o destino do `package.json` da raiz do repositório (remover, ou formalizar como workspace — decisão de produto/infra, não só técnica).
7. Mover `services/api.ts` para `shared/lib/http/`, adicionar `baseURL` via variável de ambiente (`VITE_API_URL`), mantendo fallback para `localhost:3000` em dev — comportamento atual preservado.
8. Adicionar interceptor de request (injeta `Authorization` se houver token em `localStorage`) — não quebra nada porque hoje nenhuma rota do backend valida o token.
9. Criar `AuthProvider`/`AuthContext` no frontend, populado a partir do `localStorage` existente — sem mudar onde o token é salvo, só centralizando a leitura.
10. Backend: implementar `authenticate` middleware, mas **não aplicar ainda a nenhuma rota** (só disponibilizar) — passo de preparação sem risco.
11. Backend: criar `error-handler` middleware global e `AppError`, migrando os `catch` dos controllers de `auth` para lançar `AppError` em vez de `Error` genérico — resposta de erro permanece com o mesmo formato JSON.
12. Backend: extrair `auth.repository.ts` do `auth.service.ts` (mover as queries SQL, sem mudar nenhuma regra) — primeiro exemplo do padrão de repository.
13. Introduzir TanStack Query no frontend, migrando as chamadas de `auth` (login, forgot-password, etc.) para usar `useMutation`/`useQuery` — comportamento e UI idênticos, internamente mais padronizado.
14. Introduzir react-hook-form + zod nas 4 páginas de Auth, mantendo exatamente os mesmos campos, mensagens e fluxo de navegação.
15. Criar a estrutura `modules/` no frontend; mover `pages/Modules/Service.tsx` para `modules/atendimento/pages/AtendimentoPage.tsx` e `pages/Modules/Agenda.tsx` para `modules/agenda/pages/AgendaPage.tsx`, ajustando só os imports — zero mudança visual.
16. Construir `Alert` no design system e substituir os blocos de erro/sucesso repetidos nas páginas de Auth — visual idêntico (mesmas classes), só centralizado em um componente.
17. Construir `DataTable`, `Modal`, `Drawer`, `Form`-wrapper no design system, sem nenhum consumidor ainda além de uma página de showcase interna (não exposta em produção).
18. Backend: implementar enforcement de `empresa_id` no repository base, ainda sem nenhuma rota de negócio nova consumindo (preparação).
19. Backend + frontend: implementar o módulo **Clientes** de ponta a ponta como primeiro módulo real, seguindo 100% os padrões definidos — aqui, sim, é a primeira funcionalidade nova, mas a arquitetura para suportá-la já estará pronta e validada pelos passos 1-18.
20. A partir daqui, replicar o padrão do passo 19 para os demais módulos do roadmap de produto, um de cada vez.

Cada um dos passos 1-18 é uma melhoria estrutural sem funcionalidade nova e sem mudança de comportamento visível ao usuário final — exatamente o que a missão pede antes de "crescer" o produto.

---

## Pendências para validação humana

- Confirmar se Drizzle ORM (ou outro query builder type-safe) é aceitável, ou se a preferência é manter SQL puro com a camada de repository feita à mão.
- Confirmar se React Query é a escolha aceita para estado de servidor, ou se há preferência por SWR ou outra abordagem.
- Confirmar se há intenção real de white-label/multi-marca no curto-médio prazo (impacta o quão cedo investir nos tokens de tema parametrizáveis por tenant).
- Confirmar o destino do `package.json`/`node_modules` da raiz do repositório antes do passo 6 do plano de migração.
- Confirmar prioridade de negócio entre os módulos do roadmap (Clientes foi escolhido aqui como primeiro módulo de referência por ser o mais transversal — outros módulos dependem de "cliente" como entidade — mas a decisão final de prioridade é de produto).
