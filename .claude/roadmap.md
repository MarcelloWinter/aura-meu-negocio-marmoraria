# Roadmap

> Este roadmap é **inferido** a partir de lacunas, comentários, código incompleto e itens de UI sem função implementada — não é uma lista oficial de prioridades do time. Use como ponto de partida e valide com o responsável pelo produto.

## Funcionalidades sinalizadas na UI mas não implementadas

Itens já referenciados no menu lateral (`Sidebar.tsx`/`menuItems.ts`) sem rota nem página correspondente em `App.tsx`:

- [ ] **Dashboard** (`/dashboard`) — item de menu existe, página não.
- [ ] **Financeiro** (`/financeiro`) — idem.
- [ ] **Equipe** (`/equipe`) — idem.
- [ ] **Configurações** (`/configuracoes`) — idem.

## Funcionalidades parcialmente implementadas (mock-only)

- [ ] **Atendimento** — hoje é um Kanban estático com dados hardcoded. Para virar funcionalidade real, falta: endpoint(s) de backend para listar/mover atendimentos entre estágios, persistência em banco, e provavelmente drag-and-drop ou ação explícita de mudança de estágio na UI.
- [~] **Agenda** — em 2026-06-30, recebeu toggle de views (Dia/Semana/Mês), botão "Hoje" implementado, bloqueio de horários com recorrência (`FechaHorarioModal`), e formulário de agendamento aprimorado (Início/Fim com duração automática por serviço, selects ricos). Em 2026-07-02, corrigido layout de eventos sobrepostos nas views Dia/Semana (agora exibidos lado a lado com algoritmo de escalonamento de intervalos). Falta: endpoints reais de CRUD de agendamentos e bloqueios, persistência, e integração das listas de serviços/profissionais com o backend.

## Segurança e infraestrutura — bloqueadores antes de expor mais módulos

- [ ] Implementar o middleware de autenticação JWT no backend (`src/middlewares/auth.middleware.ts` está vazio) e aplicá-lo às futuras rotas de negócio.
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
- [ ] Adicionar versionamento de schema do banco de dados (migrations).
- [x] Tornar a `baseURL` do Axios configurável por ambiente. *(2026-06-25 — via `VITE_API_URL`)*

## Possíveis próximos módulos de negócio (inferência a partir do menu e do nome do produto)

- Financeiro (cobrança, pagamentos, possivelmente ligado ao estágio "Pagamento" do Atendimento).
- Equipe (cadastro de profissionais — já referenciados como texto livre na Agenda: "Júlia", "Rafa", "Você").
- Configurações (dados da empresa, hoje hardcoded como "Marmoraria Decore Granitos" no `Header`).
- Possível automação/IA no funil de atendimento, dado o uso de n8n e o domínio `aura-ia.cloud`.

## Pendências

- Validar com o time/produto a prioridade real entre os itens acima.
- Confirmar prazos ou marcos (releases) planejados.
- Confirmar se há um board externo (Trello, Jira, Linear, GitHub Projects) que deveria ser a fonte oficial do roadmap, com este arquivo apenas referenciando-o.
