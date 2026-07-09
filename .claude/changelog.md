# Changelog

Histórico reconstruído a partir do log do Git da branch `main` (repositório completo, frontend + backend). Datas e mensagens conforme os commits originais.

## 2026-07-08 — (não commitado)
**Financeiro: modal de detalhe e exclusão de transações**

- Qualquer linha de "Contas a receber" ou "Contas a pagar" é agora clicável (cursor `pointer`, highlight `hover:bg-slate-50`). O clique abre `DetalheTransacaoModal`.
- `DetalheTransacaoModal` exibe:
  - Cabeçalho colorido (teal para receita, vermelho para despesa) com ícone de tendência, rótulo do tipo e badge de status.
  - Descrição e valor em destaque no cabeçalho.
  - Campos informativos: Vencimento e Categoria (exibida com rótulo legível via `LABEL_CATEGORIA`; omitida quando não preenchida).
  - Rodapé com botão **Excluir** (lixeira + borda vermelha) e botão **Fechar**.
- Exclusão em **dois passos**: primeiro clique no "Excluir" exibe mensagem de confirmação; "Confirmar exclusão" remove a transação do array de estado e fecha o modal; "Voltar" retorna ao estado normal. O estado `confirmando` é resetado via `useEffect([transacao])` ao trocar de item selecionado.
- `ListaFiltrada` recebe nova prop opcional `onItemClick?: (t: Transacao) => void`. Quando presente, cada item é envolvido em um `div` com `role="button"`, `tabIndex={0}`, `onClick` e `onKeyDown` (Enter), desacoplando o comportamento de clique do `renderItem`.
- Adicionado mapa `LABEL_CATEGORIA` e helper `labelCategoria` para converter valores internos de categoria (ex.: `"custo_variavel"`) em rótulos legíveis (ex.: `"Custo variável"`).
- Adicionado `Trash2` aos imports de `lucide-react` e `useEffect` aos imports do React.

## 2026-07-06 — (não commitado)
**Financeiro: reformulação do formulário e filtros avançados nas listas**

### Formulário de nova receita/despesa
- Adicionado campo **Categoria** (Select): opções "Serviço / Produto / Outros" para receitas e "Custo fixo / Custo variável / Outros" para despesas. Campo obrigatório com validação inline.
- Adicionado campo **Status** (Select): "Pago / Pendente / Atrasado", padrão "Pendente". O status selecionado é persistido na transação — itens salvos como "Pago" não aparecem nas listas pendentes.
- Layout reorganizado em dois grids 2 colunas: linha 1 = Categoria + Valor, linha 2 = Data + Status. Campo Descrição em linha própria (largura total).
- Rótulo "Vencimento" renomeado para "Data". Rótulo "Cliente / Descrição" simplificado para "Descrição" em ambos os tipos.
- `Transacao` recebe campo opcional `categoria?: string` (retrocompatível com dados mock existentes que não têm categoria).
- Label do badge "Em dia" renomeado para "Pendente" em `STATUS_CONFIG`, alinhando com as opções do formulário.

### Altura limitada com scroll nas listas
- Containers de "Contas a receber" e "Contas a pagar" passaram a ter `max-h-72` + `overflow-y-auto`: crescem até 288 px e habilitam scroll ao ultrapassar esse limite, evitando que a página se alongue indefinidamente ao adicionar itens.

### Filtros avançados (`ListaFiltrada`)
- Cards de "Contas a receber" e "Contas a pagar" refatorados para usar o componente `ListaFiltrada`, que encapsula estado e lógica de filtro internamente (cada lista tem filtros independentes).
- **Campo de busca** — mantido no cabeçalho, filtra por `descricao` em tempo real.
- **Botão "Filtros"** — ao lado da busca; fica azul e exibe badge com contagem de filtros ativos quando acionado.
- **Painel expandível** com três linhas de filtro:
  - **Status**: chips multi-select "Pendente" (teal) e "Atrasado" (vermelho), visualmente distintos quando selecionados.
  - **Vence**: intervalo de datas (De / Até), inputs `type="date"` — comparação via conversão `DD/MM` → `YYYY-MM-DD` assumindo ano 2026.
  - **Valor**: intervalo numérico (Mín / Máx), inputs `type="number"`.
- **"Limpar filtros"** — botão visível na linha de valor quando qualquer filtro está ativo; reseta todo o estado de filtro.
- Mensagem "Nenhum resultado encontrado." quando filtros estão ativos mas não há correspondência; "Nenhuma conta pendente." quando a lista está vazia sem filtros.
- Função auxiliar `aplicarFiltros(itens, filtros)` aplica todos os critérios em cascata; `contaFiltrosAtivos(filtros)` computa o badge numérico.

## 2026-07-04 — (não commitado)
**Módulo Financeiro (`/financeiro`)**

- Criado `src/pages/Modules/Financeiro.tsx` — módulo completo baseado em mockup:
  - **Cards de resumo** (grid 3 colunas): Entradas (verde, `TrendingUp`), Saídas (vermelho, `TrendingDown`) e Saldo (card azul sólido, `Wallet`). Totais calculados reativamente a partir do estado `transacoes[]` — ao adicionar uma nova receita ou despesa via modal, os valores atualizam imediatamente.
  - **Gráfico "Fluxo de caixa"**: SVG puro responsivo com curva bezier suave, área preenchida com gradiente azul e eixo X com rótulos de dias posicionados via CSS (`position: absolute`, `left: ${pct}%`). Dados iniciais simulam o saldo diário de julho de 2026 com entradas e saídas distribuídas ao longo do mês.
  - **Contas a receber** e **Contas a pagar** em grid de 2 colunas: filtram automaticamente `transacoes[]` pelo tipo e status (`status !== "pago"`). Contas a receber exibem badge colorido (`Em dia` / `Atrasado`). Divisores `divide-y` entre itens.
  - **Modais "Nova receita" / "Nova despesa"**: reutilizam o componente `Modal` existente. Campos: Descrição, Valor e Vencimento — todos obrigatórios com validação inline. Vencimento convertido de ISO (`YYYY-MM-DD`) para `DD/MM` ao persistir.
  - Dados mock iniciais totalizam exatamente R$ 18.420 em receitas e R$ 7.150 em despesas (saldo R$ 11.270), espelhando o mockup de referência.
- Adicionada rota `/financeiro` em `App.tsx` e import de `Financeiro`.

## 2026-07-02 — (não commitado)
**Agenda: recorrência em eventos, detalhe de agendamento e correção de layout**

### Layout de colunas para eventos sobrepostos (views Dia e Semana)
- `Agenda.tsx` — adicionada função `calcularLayout(eventos)` que implementa um algoritmo guloso de escalonamento de intervalos: ordena os eventos por hora de início (mais longos primeiro como desempate), atribui cada evento à primeira coluna em que ele não sobrepõe o anterior, e calcula `totalCols` como o máximo de colunas usadas por qualquer evento do grupo de sobreposição +1. O resultado é um array `EventLayout[]` com `col` e `totalCols` por evento.
- `EventoCard` recebe nova prop obrigatória `layoutStyle: CSSProperties` (substitui as classes fixas `left-1 right-1`). O posicionamento horizontal agora é dinâmico: `left: calc(col/totalCols * 100% + 4px)` e `width: calc(1/totalCols * 100% - 8px)`. Eventos sem sobreposição continuam ocupando a largura completa da coluna (equivalente ao comportamento anterior).
- `DayColumn` passa os eventos do dia filtrados por `isSameDay` para `calcularLayout` e repassa o `layoutStyle` calculado para cada `EventoCard`. View de Mês não é afetada (usa renderização própria de pills).

### Recorrência em eventos (`NovoAgendamentoModal`)
- Tipo `Recorrencia` (`"nenhuma" | "diaria" | "semanal" | "quinzenal" | "mensal"`) exportado de `Agenda.tsx` e adicionado como campo opcional `recorrencia?` no tipo `Evento`.
- Unificado helper `aplicaNoDia(data, recorrencia, dia)` que substitui a duplicação entre `bloqueioAplicaNoDia` e a nova `eventoAplicaNoDia` — ambas o chamam.
- `NovoAgendamentoModal` recebe campo **Repete** (Select com as 5 opções) e exibe descrição contextual abaixo quando a recorrência é diferente de "nenhuma". `limparFormulario` reseta recorrência para "nenhuma".

### Detalhe e cancelamento de agendamento (`DetalheEventoModal`)
- Adicionado componente `DetalheEventoModal` em `Agenda.tsx`: abre ao clicar em qualquer card de evento nas views Dia/Semana/Mês. Exibe cabeçalho colorido (cor do serviço), dados completos (cliente, serviço, profissional, data/hora, recorrência, observações) com ícones Lucide, e rodapé com ações.
- **Cancelamento com confirmação em dois passos**: primeiro clique em "Cancelar agendamento" troca o rodapé para um estado de confirmação com aviso; "Sim, cancelar" remove o evento do array; "Voltar" retorna ao estado normal. O estado `confirmando` é resetado via `useEffect([evento])` ao trocar de evento.
- Prop `onEventoClick: (evento: Evento) => void` propagada por `DayColumn` → `AgendaDiaView` / `AgendaSemanaView` / `AgendaMesView` → `Agenda`.

### Correção de texto cortado em cards pequenos
- `EventoCard`: altura mínima de 28 px via `Math.max(altura, 28)` garante que cards de 15 min sempre exibam ao menos o nome do cliente. Cards com `alturaDisplay < 40` usam padding compacto (`px-2 py-1`) e ocultam a linha do serviço; demais usam `p-2` e exibem ambas as linhas. `overflow-hidden` mantido para não vazar texto além do card.

## 2026-06-30 — (não commitado)
**Melhorias no módulo Agenda: views, fechar horário e formulário aprimorado**

- `Select.tsx` reescrito como dropdown customizado (substituiu `<select>` nativo): abre/fecha ao clicar, chevron animado, opção selecionada destacada, e nova prop `renderOption` para conteúdo rico nas opções.
- `NovoAgendamentoModal`: campo de horário dividido em **Início** e **Fim**; Fim é calculado automaticamente via `DURACAO_POR_SERVICO` (em minutos) ao selecionar o serviço ou alterar o Início — mas ainda editável livremente. A `duracao` do evento agora reflete a diferença real entre Fim e Início. Layout corrigido: Data em linha própria (largura total), Início e Fim em `grid-cols-2`. Serviço agora exibe ponto colorido por tipo; Profissional exibe avatar com iniciais e cor por profissional.
- `Agenda.tsx` — toggle de visualização (segmented control **Dia / Semana / Mês**), navegação (← →) e subtítulo do header adaptados por view; botão **Hoje** agora funciona. Exportados os tipos `Recorrencia` e `Bloqueio`. Helper `bloqueioAplicaNoDia` para verificar recorrência (diária, semanal, quinzenal, mensal) sem imports adicionais. Componente `BloqueioBlock` renderiza o bloco de horário fechado com padrão de listras diagonais (CSS `repeating-linear-gradient`) e ícone de cadeado; fica em `z-0` atrás dos eventos (`z-10`). Na view Mês, bloqueios aparecem como pills cinzas com ícone `Lock` e intervalo de horário. Botão **Fechar horário** (outline, ícone `Lock`) adicionado ao header.
- `FechaHorarioModal.tsx` (novo): formulário com Data, Início, Fim e campo **Repete** (Não repete / Diariamente / Semanalmente / Quinzenalmente / Mensalmente). Exibe descrição contextual ao selecionar recorrência. Ao confirmar, adiciona o bloqueio ao estado local da Agenda — aparece imediatamente nas 3 views com a lógica de recorrência aplicada.

## 2026-06-25 — `bdf4042`
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
