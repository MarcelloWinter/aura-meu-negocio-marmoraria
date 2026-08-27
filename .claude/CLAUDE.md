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

1. **Não há proteção de rotas no frontend** — `/atendimento` e `/agenda` são acessíveis sem login. Ver [architecture.md](./architecture.md) e [roadmap.md](./roadmap.md). *(Fundação para resolver isso já existe: `AuthContext` foi criado em 2026-06-25 — ver Etapa 8 do [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md). O guard de rota ainda não foi aplicado.)* Isso ficou mais urgente desde 2026-08-27: `/clientes` e `/atendimento` agora batem em endpoints reais (`/clientes`, `/chats`) sem autenticação nenhuma.
2. **O middleware de autenticação do backend está vazio** (`src/middlewares/auth.middleware.ts`) — nenhuma rota valida o JWT atualmente. Ver [backend.md](./backend.md). Ainda não foi tocado nesta primeira rodada de execução (era escopo de backend, fora do lote "fundações sem mudar comportamento" executado em 2026-06-25).
3. **A maioria dos módulos de negócio ainda usa dados 100% mockados** (Agenda, Financeiro, Vendas, Equipe, Configurações), sem integração com o backend. Desde 2026-07-30, Financeiro e Vendas compartilham estado via `FinanceiroContext` (aprovar uma venda gera uma receita no Financeiro), mas isso é só client-side (React Context) — não há persistência real. **Exceção desde 2026-08-27**: Clientes e Atendimento já leem/escrevem dados reais no Postgres (via `GET/POST/DELETE /clientes` e `GET /chats`) — ver ponto 5 abaixo e [business-rules.md](./business-rules.md).
4. ~~Há um `package.json` na raiz do repositório...~~ **Resolvido em 2026-06-25**: investigado e corrigido. O `package.json`/`node_modules` da raiz não era resquício morto — o frontend dependia silenciosamente dele (Node resolvia `axios`, `tailwindcss` e `@tailwindcss/vite` subindo até `node_modules` da raiz, porque esses pacotes nunca estiveram declarados em `aura-meu-negocio/package.json`). As 3 dependências foram declaradas e instaladas localmente em `aura-meu-negocio/`, e o `package.json`/`package-lock.json`/`node_modules` da raiz do repositório foram removidos (build validado sem eles).
5. **O Postgres deste projeto (`DB_NAME=n8n`, `easypanel.aura-ia.cloud`) é compartilhado com uma instância n8n real em produção** — confirmado em 2026-08-27. Por isso, **o backend só pode ler/escrever em `clientes_copy`, `chats_copy` e `empresas_copy` — nunca nas tabelas live `clientes`/`chats`/`empresas`** (regra também salva como memória de projeto, fora do repositório). Ver [database.md](./database.md).
6. **Existe outro repositório Git na mesma máquina de desenvolvimento**, `C:\Users\Marcello\aura-meu-negocio\` (`github.com/MarcelloWinter/aura-meu-negocio`, sem relação de código com este projeto), cujo backend roda por padrão na porta 3000 — a mesma porta que este projeto usava antes. Por isso, o backend deste repositório (`aura-meu-negocio-marmoraria`) usa a porta **3010** desde 2026-08-27 (`PORT` no `.env` do backend, `VITE_API_URL` no `.env` do frontend). Se voltar a ver comportamento de um backend "antigo"/diferente do esperado, confirme qual processo está respondendo na porta que o frontend está de fato chamando.

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

## Atualização (2026-08-23)

- **Clientes**: cadastro ganhou CPF/CNPJ, e-mail e endereço estruturado (CEP/rua/número/complemento/bairro/cidade/UF, cada um em seu próprio campo). O modal de detalhes do cliente agora sempre mostra a seção "Dados pessoais" (com "—" quando um campo não foi preenchido). O formulário completo de criação foi extraído para um componente compartilhado (`src/components/NovoClienteModal.tsx`), usado tanto na página Clientes quanto no `ClienteSelect` (Agenda, Financeiro, Vendas) — antes o `ClienteSelect` tinha um mini-formulário próprio, mais simples.
- **Financeiro**: despesas ganharam opção de repetição em parcelas mensais (ex.: 4 boletos de uma compra) — gera N transações independentes, uma por mês, com sufixo `(i/N)` na descrição.
- **Novo módulo Configurações** (`/configuracoes`): rota e página criadas (o item já existia na Sidebar, mas sem página). Só duas abas — **Empresa** (dados da empresa + endereço) e **Integrações** (lista mockada: WhatsApp/n8n, Google Agenda, Webhook) — a pedido do usuário, mesmo o mockup de referência tendo mais abas.
- **Navegação cliente → cadastro**: em Agenda, Financeiro (receitas), Vendas e Atendimento, a referência ao cliente virou um link clicável que abre `/clientes` já com o cadastro daquele cliente. `Evento`, `Transacao` e `Venda` ganharam campo opcional `clienteId`.
- **Sidebar**: botão "Sair" (logout) adicionado — antes não havia nenhuma forma de encerrar sessão pela UI, apesar do `AuthContext.logout()` já existir desde 2026-06-25.
- **Equipe**: lista de permissões corrigida para refletir as abas reais do sistema (tinha `"dashboard"`, que não existe, e faltavam Clientes/Vendas/Equipe).
- **Header**: ícone de sino de notificação (sem funcionalidade) removido.
- Detalhes técnicos completos em [business-rules.md](./business-rules.md), [frontend.md](./frontend.md), [ui.md](./ui.md) e [changelog.md](./changelog.md).

## Atualização (2026-08-27)

- **Banco de dados**: confirmado que o Postgres (`DB_NAME=n8n`, `easypanel.aura-ia.cloud`) é compartilhado com uma instância n8n real em produção. Regra adotada: o backend só toca em `clientes_copy`, `chats_copy` e `empresas_copy` (cópias de estrutura+dados das tabelas live), nunca nas tabelas live diretamente.
- **Clientes e Atendimento passaram a usar dados reais**, deixando de ser mockados: novos módulos de backend `clientes` (`GET`/`POST`/`DELETE /clientes`, sobre `clientes_copy` + nova tabela `enderecos`) e `chats` (`GET /chats`, somente leitura, sobre `chats_copy`). `ClientesContext` busca e persiste via API; `Service.tsx` (Atendimento) monta o kanban dinamicamente a partir dos valores reais de `etapa` (não mais as 6 colunas fixas do mockup).
- **Nova tabela `enderecos`** e colunas `cpf_cnpj`/`email`/`endereco_id` em `clientes_copy`, usadas pelo formulário de cliente que já existia desde 2026-08-23.
- **Cursor de mãozinha** em todo elemento clicável (botões, checkboxes, radios) via uma regra CSS global — antes só apontava a seta padrão, já que o Tailwind não dá `cursor: pointer` a `<button>` por padrão desde a v3.3.
- **Corrigido um conflito de porta com outro repositório Git** (`aura-meu-negocio`, não relacionado a este projeto) que também roda um backend na porta 3000 nesta máquina — o backend deste projeto passou a usar a porta 3010. Ver ponto 6 dos avisos acima.
- **Não resolvido**: `chats_copy`/`empresas_copy` foram esvaziadas e `clientes_copy` perdeu a maioria dos registros por uma causa ainda não identificada — não foi nenhuma query deste backend. Usuário vai investigar e explicar antes de recriar os dados. Ver Pendências em [database.md](./database.md).
- Detalhes técnicos completos em [backend.md](./backend.md), [database.md](./database.md), [business-rules.md](./business-rules.md), [frontend.md](./frontend.md), [ui.md](./ui.md) e [changelog.md](./changelog.md).

## Pendências gerais

- Confirmar se o nome do negócio de exemplo ("Marmoraria Decore Granitos") é um cliente real ou apenas dado de mock.
- Entender a causa do esvaziamento de `chats_copy`/`empresas_copy`/`clientes_copy` em 2026-08-27 antes de recriar os dados ou continuar construindo sobre essas tabelas.
