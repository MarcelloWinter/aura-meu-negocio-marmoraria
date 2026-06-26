# Changelog

Histórico reconstruído a partir do log do Git da branch `main` (repositório completo, frontend + backend). Datas e mensagens conforme os commits originais.

## 2026-06-25 — (ainda não commitado)
**Implementação do formulário "Novo agendamento" (modal) na Agenda**
- Criados os componentes de design system `Modal`, `Select` e `Textarea` (`src/ui/`), seguindo a mesma API visual do `Input` existente.
- Corrigido bug pré-existente no `Button`: variante `secondary` tinha borda invisível (`border-[var(--white)]`) — corrigida para `border-[var(--border)]`.
- Criado `NovoAgendamentoModal` (`src/pages/Modules/`), formulário de domínio com Cliente, Serviço, Profissional, Data, Horário e Observações, com validação obrigatória (exceto Observações), seguindo o padrão de validação manual já usado nas páginas de Auth.
- Botão "Novo agendamento" da Agenda agora abre o modal; ao salvar, o evento é adicionado ao estado local da Agenda e renderizado no grid.
- Modelo `Evento` migrado de dia-da-semana (`dia: number`, 0-6) para data absoluta (`data: Date`), corrigindo o comportamento de mocks que se repetiam indefinidamente em qualquer semana navegada.
- Corrigido bug de posicionamento vertical dos eventos no grid (offset incorreto de `-8` horas).
- Horário agora aceita minutos (posicionamento fracionário, ex.: 15:30 → 15.5h).
- Validado visualmente via Playwright (headless): modal abre, validação de campos obrigatórios funciona, e o evento criado aparece corretamente posicionado na coluna/horário certos. Sem erros de console.

## 2026-06-25 — `6279196` / `1072a5e`
**Execução do 1º lote de fundações arquiteturais (Etapa 8, passos 1-9 do ARCHITECTURE_PLAN.md)**
- Corrigidas dependências do frontend que só funcionavam via `node_modules` da raiz do repositório (`axios`, `tailwindcss`, `@tailwindcss/vite`).
- Prettier configurado e código-fonte formatado.
- Alias de import `@/` configurado (tsconfig + vite.config).
- Removidos arquivos vazios e duplicatas: `Card`/`PageHeader` em `src/components`, `Sidebar/SidebarItem.tsx`, `Sidebar/menuItems.ts`, `contexts/SidebarContext.tsx`, `hooks/UseSidebar.tsx`, `Sidebar/SidebarLogo.tsx`, `PageContainer/PageContainer.tsx`.
- `baseURL` do Axios passou a vir de `VITE_API_URL` (`.env`/`.env.example`); adicionados interceptors de request/response.
- Criado `src/contexts/AuthContext.tsx`, centralizando login/logout; `Login.tsx` migrado para usá-lo.
- Corrigidos, como pré-requisito para validar o build: 2 imports não utilizados que já quebravam `tsc -b`, e 5 usos de `catch (error: any)` substituídos por um helper `getApiErrorMessage`.
- Removidos `package.json`, `package-lock.json` e `node_modules` da raiz do repositório, após confirmar que o frontend passou a ser autossuficiente.
- Nenhuma mudança visual ou de comportamento — build, lint e smoke test do `npm run dev` validados (antes e depois da remoção da raiz).

## 2026-06-23 — `805fd16`
**Início do visual do módulo de agenda**
- Criação da página `Agenda.tsx` (`/agenda`): grid semanal de horários, navegação entre semanas, eventos mockados com cor por serviço.

## 2026-06-22 — `b169c62`
**Finalização v1 da Sidebar e visual do pipeline do módulo de atendimento**
- Conclusão da primeira versão da Sidebar.
- Construção do visual do pipeline/Kanban do módulo de Atendimento (`Service.tsx`), com as 6 colunas de estágio e clientes mockados.

## 2026-06-18 — `e1bedbe`
**Implementação Sidebar**
- Introdução do componente de Sidebar de navegação e do `DashboardLayout`/`Header` associados.

## 2026-06-16 — `02a0a11`
**Modularização de componentes da autenticação e criação do módulo de atendimento**
- Refatoração dos componentes de autenticação para uma estrutura modular reutilizável (`AuthCard`, `AuthLayout`, `Background`, etc.).
- Criação inicial do módulo de Atendimento.

## 2026-06-15 — `f5e5631`
**Ajustes em identação e componentização de logo**
- Padronização de indentação.
- Extração do `Logo` como componente reutilizável e parametrizável (tamanho, texto visível/oculto).

## 2026-06-10 — `04e5ccb`
**Primeira versão de autenticação**
- Primeira implementação do fluxo de autenticação: Login, recuperação de senha (com etapas de solicitação, verificação de código e redefinição), e o backend Express/PostgreSQL correspondente (módulo `auth` completo: rotas, controllers, services, JWT, bcrypt).

## Pendências

- Este changelog cobre apenas o histórico de commits disponível no repositório local no momento da análise (2026-06-25). Caso existam branches não mescladas, tags de release, ou um changelog mantido manualmente em outro lugar, integrar/referenciar aqui.
- Definir formato de manutenção deste arquivo daqui para frente (ex.: atualizar a cada PR/release, seguindo ou não o padrão [Keep a Changelog](https://keepachangelog.com/)).
