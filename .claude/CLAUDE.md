# Aura Meu Negócio — Guia do Projeto

Este diretório (`.claude/`) contém a documentação viva do projeto, gerada a partir da análise do código existente em 2026-06-25. Use estes arquivos como contexto antes de propor ou implementar qualquer alteração.

## Visão geral

"Aura Meu Negócio" é um sistema de gestão para pequenos negócios (o exemplo de dados mockados usado hoje é uma marmoraria — "Marmoraria Decore Granitos"), com foco inicial em:

- Autenticação de usuários (login + recuperação de senha via WhatsApp/n8n)
- Atendimento ao cliente em formato pipeline/Kanban
- Agenda de serviços/agendamentos

O projeto é composto por dois pacotes independentes no mesmo repositório (não é um monorepo formal — não há workspaces configurados):

| Pacote | Caminho | Stack |
|---|---|---|
| Frontend | `aura-meu-negocio/` | React 19 + Vite + TypeScript + Tailwind CSS |
| Backend | `aura-meu-negocio-backend/aura-meu-negocio-backend/` | Express 5 + TypeScript + PostgreSQL (driver `pg`, sem ORM) |

## Índice da documentação

- [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) — **documento de referência oficial** para a evolução arquitetural do projeto (diagnóstico, arquitetura alvo, roadmap em fases, estrutura de diretórios definitiva, design system e plano de migração passo a passo). Toda decisão de arquitetura nova deve estar alinhada a este documento.
- [architecture.md](./architecture.md) — visão arquitetural macro do estado **atual**, como frontend e backend se conectam, infraestrutura.
- [frontend.md](./frontend.md) — estrutura de pastas, roteamento, estado, padrões do app React.
- [backend.md](./backend.md) — estrutura de camadas, endpoints, autenticação no servidor.
- [database.md](./database.md) — tabelas e relacionamentos inferidos do SQL existente.
- [business-rules.md](./business-rules.md) — regras de negócio implementadas (e mockadas) hoje.
- [ui.md](./ui.md) — design system: cores, tipografia, componentes reutilizáveis.
- [coding-standards.md](./coding-standards.md) — convenções de código observadas no projeto.
- [roadmap.md](./roadmap.md) — lacunas e próximos passos inferidos do estado atual do código.
- [changelog.md](./changelog.md) — histórico de mudanças baseado nos commits do Git.

## Como esta documentação foi gerada

Toda a documentação foi extraída por leitura direta do código-fonte (sem suposições externas). Pontos que não puderam ser inferidos com segurança foram deixados explicitamente em seções **"Pendências"** dentro de cada arquivo, para validação humana.

## Avisos importantes encontrados durante a análise

Estes pontos aparecem detalhados nos arquivos específicos, mas merecem destaque aqui por afetarem segurança/manutenção:

1. **Não há proteção de rotas no frontend** — `/atendimento` e `/agenda` são acessíveis sem login. Ver [architecture.md](./architecture.md) e [roadmap.md](./roadmap.md). *(Fundação para resolver isso já existe: `AuthContext` foi criado em 2026-06-25 — ver Etapa 8 do [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md). O guard de rota ainda não foi aplicado.)*
2. **O middleware de autenticação do backend está vazio** (`src/middlewares/auth.middleware.ts`) — nenhuma rota valida o JWT atualmente. Ver [backend.md](./backend.md). Ainda não foi tocado nesta primeira rodada de execução (era escopo de backend, fora do lote "fundações sem mudar comportamento" executado em 2026-06-25).
3. **Todos os módulos de negócio usam dados 100% mockados** (Atendimento, Agenda, Clientes, Financeiro, Vendas), sem integração com o backend ainda. Desde 2026-07-30, Financeiro e Vendas compartilham estado via `FinanceiroContext` (aprovar uma venda gera uma receita no Financeiro), mas isso é só client-side (React Context) — não há persistência real. Ver [business-rules.md](./business-rules.md).
4. ~~Há um `package.json` na raiz do repositório...~~ **Resolvido em 2026-06-25**: investigado e corrigido. O `package.json`/`node_modules` da raiz não era resquício morto — o frontend dependia silenciosamente dele (Node resolvia `axios`, `tailwindcss` e `@tailwindcss/vite` subindo até `node_modules` da raiz, porque esses pacotes nunca estiveram declarados em `aura-meu-negocio/package.json`). As 3 dependências foram declaradas e instaladas localmente em `aura-meu-negocio/`, e o `package.json`/`package-lock.json`/`node_modules` da raiz do repositório foram removidos (build validado sem eles).

## Execução do plano arquitetural

Em 2026-06-25 foi executado o primeiro lote do plano de migração ([ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md), Etapa 8, passos 1-9 — "fundações sem mudar comportamento"):

- Dependências do frontend corrigidas (`axios`, `tailwindcss`, `@tailwindcss/vite` agora declaradas e instaladas em `aura-meu-negocio/package.json`, antes resolvidas via `node_modules` da raiz).
- Prettier configurado e código formatado (`tabs`, sem mudança de comportamento).
- Alias de import `@/` configurado em `tsconfig.app.json` + `vite.config.ts` (ainda não adotado nos imports existentes).
- Arquivos vazios removidos: `hooks/UseSidebar.tsx`, `components/Sidebar/SidebarLogo.tsx`, `components/PageContainer/PageContainer.tsx`.
- Duplicatas removidas: `components/Card.tsx` e `components/PageHeader.tsx` (mantidos só em `src/ui/`); Sidebar consolidada em `components/Sidebar/Sidebar.tsx` (removidos `SidebarItem.tsx`, `menuItems.ts`, `contexts/SidebarContext.tsx`, que não eram usados por nenhuma página).
- `baseURL` do Axios agora vem de `VITE_API_URL` (`.env`/`.env.example`), com fallback para `http://localhost:3000`.
- Interceptors adicionados em `src/services/api.ts`: injeção automática de `Authorization` (quando há token) e limpeza de sessão em respostas `401` (hoje inerte, pois o backend ainda não valida token).
- `src/contexts/AuthContext.tsx` criado, centralizando login/logout/sessão; `Login.tsx` já usa `useAuth().login(...)` em vez de gravar direto no `localStorage`.
- Corrigido, como efeito colateral necessário para validar o build: 2 imports não utilizados que já quebravam `tsc -b` (`X` em `Sidebar.tsx`, `Logo`/`Background` em `ResetPassword.tsx`) e 5 usos de `catch (error: any)` nas páginas de Auth, substituídos por um helper `getApiErrorMessage` em `services/api.ts`.
- Build de produção (`npm run build`), `tsc -b`, `npm run lint` e um smoke test do `npm run dev` foram validados — nenhuma mudança visual ou de comportamento.

`package.json`/`node_modules` da raiz do repositório foram removidos (passo 6 concluído). Ainda **não executado** desse lote: a adoção do alias `@/` nos imports existentes (passo 2 só configurou a capacidade, não migrou nenhum arquivo).

## Atualização (2026-07-30)

- **Agenda**: campo "Serviço" removido do formulário de novo agendamento (a pedido do usuário) — duração passou a ser sempre 60 min fixos. Commitado e enviado para `origin/main` (`1cae5e2`).
- **Novo módulo Vendas** (`/vendas`): pedidos por item (não valor único), com pipeline de status em kanban (Orçamento → Aprovado → Em produção → Entregue) e geração automática de receita no Financeiro ao aprovar um orçamento. Estado do Financeiro foi extraído para um novo `FinanceiroContext` (mesmo padrão do `ClientesContext`) para viabilizar essa integração. Ainda não commitado.
- Detalhes técnicos completos em [business-rules.md](./business-rules.md) (seção "Módulo Vendas") e [changelog.md](./changelog.md).

## Pendências gerais

- Confirmar se o nome do negócio de exemplo ("Marmoraria Decore Granitos") é um cliente real ou apenas dado de mock.
