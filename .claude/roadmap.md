# Roadmap

> Este roadmap é **inferido** a partir de lacunas, comentários, código incompleto e itens de UI sem função implementada — não é uma lista oficial de prioridades do time. Use como ponto de partida e valide com o responsável pelo produto.

## Funcionalidades sinalizadas na UI mas não implementadas

Itens já referenciados no menu lateral (`Sidebar.tsx`/`menuItems.ts`) sem rota nem página correspondente em `App.tsx`:

- [x] **Financeiro** (`/financeiro`) — implementado em 2026-07-04 (mockado, sem backend).
- [x] **Vendas** (`/vendas`) — implementado em 2026-07-30 (mockado, sem backend; ver [business-rules.md](./business-rules.md)).
- [x] **Equipe** (`/equipe`) — já implementado (mockado; lista de permissões corrigida em 2026-08-23, ver [business-rules.md](./business-rules.md)). Este item estava desatualizado — a página já existia antes desta rodada de documentação.
- [x] **Configurações** (`/configuracoes`) — implementado em 2026-08-23 (mockado, só abas Empresa e Integrações; ver [business-rules.md](./business-rules.md)).

> Nota: o item "Dashboard" (`/dashboard`) que constava aqui foi removido — não há esse item no menu da Sidebar atual (`Sidebar.tsx`); era uma imprecisão desta lista, não uma funcionalidade planejada e depois cancelada.

## Funcionalidades parcialmente implementadas (mock-only)

- [x] **Clientes** — desde 2026-08-27, dados reais (`GET`/`POST`/`DELETE /clientes` sobre `clientes_copy` + `enderecos`). Falta: autenticação/escopo por empresa nas rotas, e decidir se `agendamentos` do cliente também deveria vir de uma tabela real (hoje sempre vazio).
- [~] **Atendimento** — desde 2026-08-27, dados reais (`GET /chats` sobre `chats_copy`, colunas do kanban geradas dinamicamente a partir de `etapa`). Ainda falta: mover um atendimento entre etapas pela UI (hoje só leitura), endpoint de escrita, e autenticação/escopo por empresa.
- [x] **Agenda** — desde 2026-08-29, dados reais para os eventos (`GET`/`POST`/`DELETE /agendamentos` sobre `agendamentos_copy`) e para os profissionais (`GET /usuarios`, substituindo a lista fixa "Júlia/Rafa/Você"). Falta: endpoint/persistência para bloqueios de horário (`FechaHorarioModal` continua só local), autenticação/escopo por empresa, e decidir se `servico_id`/`pago` (já existem na tabela) deveriam voltar à UI.
- [~] **Vendas** — pipeline de status (orçamento/aprovado/produção/entregue) e geração automática de receita no Financeiro ao aprovar já funcionam sobre estado local. Falta: endpoints de backend para CRUD de vendas, persistência, e decidir se a integração com o Financeiro deve virar uma chamada de API única (hoje são dois `useState`/contexts client-side que só coincidem por estarem na mesma árvore React).

## Segurança e infraestrutura — bloqueadores antes de expor mais módulos

- [ ] Implementar o middleware de autenticação JWT no backend (`src/middlewares/auth.middleware.ts` está vazio) e aplicá-lo às futuras rotas de negócio — **agora mais urgente**, já que `/clientes`, `/chats` (2026-08-27), `/agendamentos` e `/usuarios` (2026-08-29) já são rotas de negócio reais e continuam completamente abertas.
- [ ] Aplicar escopo por `empresa_id` em `/clientes`, `/chats` e `/agendamentos` (hoje retornam/alteram todos os registros, de qualquer empresa).
- [ ] Implementar rotas protegidas no frontend (guard que redireciona para `/` se não houver `@aura:token` válido).
- [x] Adicionar interceptor do Axios para enviar `Authorization: Bearer <token>` automaticamente e tratar respostas `401`. *(2026-06-25 — limpa sessão local em 401; redirecionamento para login ainda depende das rotas protegidas, item acima)*
- [ ] Decidir e implementar estratégia de expiração/renovação de sessão (hoje o JWT expira em 15 minutos sem refresh).
- [ ] Revisar o fluxo de reset de senha para adicionar uma verificação server-side de que o código foi validado antes de aceitar `POST /auth/reset-password` (ver [business-rules.md](./business-rules.md)).

## Débito técnico identificado

- [x] Resolver duplicação de componentes `Card`/`PageHeader` entre `src/ui` e `src/components`. *(2026-06-25 — cópias em `src/components` removidas)*
- [x] Resolver duplicação de implementação de Sidebar (`Sidebar.tsx` vs. `SidebarItem.tsx` + `menuItems.ts` + `SidebarContext`). *(2026-06-25 — consolidado em `Sidebar.tsx`)*
- [x] Remover ou implementar arquivos vazios: `src/hooks/UseSidebar.tsx`, `src/components/Sidebar/SidebarLogo.tsx`, `src/components/PageContainer/PageContainer.tsx`. *(2026-06-25 — removidos)*
- [ ] Remover ou implementar `src/middlewares/auth.middleware.ts` (vazio) — fora do escopo do lote de 2026-06-25 (mudaria comportamento de autenticação).
- [ ] Remover ou integrar `src/styles/theme.ts` e `src/styles/globals.css` (atualmente não usados).
- [x] Esclarecer o propósito do `package.json`/`node_modules` na raiz do repositório. *(2026-06-25 — `axios`/`tailwindcss`/`@tailwindcss/vite` declarados localmente em `aura-meu-negocio/package.json`; `package.json`/`package-lock.json`/`node_modules` da raiz removidos)*
- [x] Corrigir a fórmula de posicionamento de eventos na Agenda. *(2026-06-25 — era `(evento.hora - 8) * HOUR_HEIGHT`, agora `evento.hora * HOUR_HEIGHT`, alinhado à grade de 24h)*
- [ ] Adicionar versionamento de schema do banco de dados (migrations) — mais importante agora que existem mudanças de schema reais (`enderecos`, colunas em `clientes_copy` em 2026-08-27; `observacoes`/`recorrencia` em `agendamentos_copy` em 2026-08-29) aplicadas via script ad-hoc, não commitadas.
- [x] Tornar a `baseURL` do Axios configurável por ambiente. *(2026-06-25 — via `VITE_API_URL`; porta mudou de 3000 para 3010 em 2026-08-27, ver [architecture.md](./architecture.md))*
- [ ] Investigar por que `chats_copy`/`empresas_copy`/`clientes_copy` (desde 2026-08-27) e `agendamentos_copy` (desde 2026-08-29) têm apresentado contagem de linhas instável (ver Pendências em [database.md](./database.md)) antes de continuar construindo sobre essas tabelas.

## Possíveis próximos módulos de negócio (inferência a partir do menu e do nome do produto)

- ~~Financeiro (cobrança, pagamentos, possivelmente ligado ao estágio "Pagamento" do Atendimento).~~ *(implementado em 2026-07-04 — mockado)*
- ~~Vendas (pedidos por item, ligados a Clientes e Financeiro).~~ *(implementado em 2026-07-30 — mockado, ver [business-rules.md](./business-rules.md))*
- ~~Equipe (cadastro de profissionais).~~ *(a página `/equipe` já existia, mockada; profissionais na Agenda passaram a vir de `usuarios` em 2026-08-29 — não de `Equipe`, que continua sem nenhuma tabela real por trás)*
- ~~Configurações (dados da empresa).~~ *(implementado em 2026-08-23 — mockado, sem persistência; nome da empresa no `Header` continua hardcoded, não lê da aba Empresa)*
- Possível automação/IA no funil de atendimento, dado o uso de n8n e o domínio `aura-ia.cloud`.

## Pendências

- Validar com o time/produto a prioridade real entre os itens acima.
- Confirmar prazos ou marcos (releases) planejados.
- Confirmar se há um board externo (Trello, Jira, Linear, GitHub Projects) que deveria ser a fonte oficial do roadmap, com este arquivo apenas referenciando-o.
