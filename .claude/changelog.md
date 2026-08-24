# Changelog

Histórico reconstruído a partir do log do Git da branch `main` (repositório completo, frontend + backend). Datas e mensagens conforme os commits originais.

## 2026-08-23 — (não commitado)
**Dados pessoais de cliente, repetição de despesas, módulo Configurações, navegação cliente → cadastro, logout e limpezas de UI**

### Clientes: CPF/CNPJ, e-mail e endereço estruturado
- Tipo `Cliente` (`ClientesContext.tsx`) ganhou campos opcionais `cpfCnpj?`, `email?` e `endereco?: Endereco` — `Endereco` é um tipo próprio com `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, todos opcionais.
- Formulário "Novo cliente" (`Clientes.tsx`) ganhou os três campos (CPF/CNPJ e e-mail em texto livre; endereço com **um input por parte** — CEP, Número, Rua, Complemento, Bairro, Cidade, UF — em vez de um único campo de texto livre), todos opcionais.
- `DetalheClienteModal` passou a exibir **sempre** a seção "Dados pessoais" (CPF/CNPJ, E-mail, Endereço formatado via `formatarEndereco`), com "—" no lugar de campos não preenchidos, em vez de esconder a seção inteira quando algum campo estava vazio.
- **Refatoração**: o formulário completo de "Novo cliente" foi extraído para um componente compartilhado, `src/components/NovoClienteModal.tsx` — encapsula toda a criação (inclui a cor do avatar via `useClientes()`) e expõe `onCreated?(cliente)`. `Clientes.tsx` e `ClienteSelect.tsx` (usado em Financeiro, Vendas e `NovoAgendamentoModal`) passaram a usá-lo, eliminando o mini-formulário antigo do `ClienteSelect` (`NovoClienteRapido`, que só tinha Nome + Telefone) — agora o botão "Novo cliente" abre o formulário completo em qualquer lugar do sistema onde um cliente é selecionado.

### Financeiro: repetição de despesas em parcelas mensais
- `NovaTransacaoModal`, apenas para despesas: checkbox "Repetir nos próximos meses" + campo numérico "Quantos meses (incluindo este)" (2 a 60, validado).
- Ao salvar com repetição ativa, são geradas N transações — mesma descrição com sufixo `(i/N)`, mesmo valor, uma por mês a partir da data informada. Nova função `adicionarMeses(dataISO, meses)` soma meses preservando o dia (com *clamp* para o último dia do mês quando o mês de destino é mais curto, ex.: dia 31 de janeiro → 28/29 de fevereiro).
- `onSave` do modal passou a entregar um array de transações (`Omit<Transacao, "id">[]`) em vez de uma única; `Financeiro.tsx` insere cada uma via `addTransacao` em sequência.

### Novo módulo Configurações (`/configuracoes`)
- Criado `src/pages/Modules/Configuracoes.tsx` e registrada a rota em `App.tsx` (o item já existia na Sidebar, mas sem página correspondente).
- Duas abas apenas — **Empresa** e **Integrações** — em pill de abas (mesmo padrão visual do mockup de referência fornecido pelo usuário).
  - **Empresa**: formulário com Nome da empresa (pré-preenchido com "Marmoraria Decore Granitos"), CNPJ, Telefone, E-mail e Endereço com campos separados (mesmo padrão de Clientes: CEP/Número/Rua/Complemento/Bairro/Cidade/UF). Estado local, sem persistência.
  - **Integrações**: lista mockada de 3 integrações (WhatsApp via n8n — conectado por padrão, Google Agenda, Webhook personalizado), cada uma com badge de status e botão Conectar/Desconectar (alterna estado local, sem chamada real).

### Navegação cliente → cadastro ("clicar para ver o cliente")
- Onde Agenda, Financeiro, Vendas e Atendimento fazem referência a um cliente, a referência agora é clicável e leva para `/clientes`, abrindo automaticamente o cadastro daquele cliente:
  - **Agenda** (`DetalheEventoModal`): campo "Cliente" virou botão com seta indicando link.
  - **Financeiro** (`DetalheTransacaoModal`): nome do cliente (guardado como `descricao` da receita) virou link — só para receitas, já que despesas nunca têm cliente vinculado (descrição é texto livre).
  - **Vendas** (`DetalheVendaModal`): nome do cliente no cabeçalho colorido virou link.
  - **Atendimento** (`AtendimentoCard`, em `Service.tsx`): nome do cliente em cada card do kanban virou link (chevron ao lado do nome).
- Novo campo opcional `clienteId?: string` adicionado a `Evento` (Agenda), `Transacao` (Financeiro) e `Venda` (Vendas) — preenchido automaticamente a partir do `Cliente` escolhido em `ClienteSelect` nos respectivos formulários de criação.
- Para dados mockados que não têm `clienteId` (ex.: eventos/vendas/atendimentos iniciais), o link cai num **fallback por nome**: navega para `/clientes?nome=<nome>`, que abre o cliente automaticamente se houver correspondência exata de nome, ou apenas pré-preenche a busca quando não encontra.
- `Clientes.tsx` passou a ler `clienteId`/`nome` da URL (`useSearchParams`) num `useEffect` que abre o modal de detalhes do cliente correspondente e limpa os parâmetros da URL em seguida.

### Sidebar: botão de logout
- Adicionado botão "Sair" fixo no rodapé da Sidebar (abaixo do menu, com borda separadora), estilizado em vermelho. Chama `useAuth().logout()` (limpa `@aura:token`/`@aura:user` do `localStorage`) e navega para `/` (Login). Funciona também no modo colapsado da sidebar (só ícone, com tooltip "Sair").

### Equipe: lista de permissões corrigida
- O tipo `Permissao` e `PERMISSOES_CONFIG` (`Equipe.tsx`) listavam `"dashboard"` — aba que não existe no sistema — e não incluíam Clientes, Vendas nem Equipe. Corrigido para refletir exatamente as abas reais da Sidebar: Atendimento, Agenda, Clientes, Vendas, Financeiro, Equipe, Configurações. Mock da usuária proprietária (Maria Silva) atualizado para ter todas as permissões corretas.

### Header: remoção do sino de notificação
- Ícone de sino (`Bell`, sem funcionalidade) removido do `Header.tsx`, a pedido do usuário.

### Validação
- `tsc -b` e `npm run lint` validados a cada mudança, sem novos erros/warnings além dos já pré-existentes no projeto (4 ocorrências da regra `react-hooks/set-state-in-effect` + 1 warning `exhaustive-deps`, presentes antes desta sessão).
- Validado visualmente via Edge headless (`--headless --screenshot`, já que `chromium-cli`/Playwright não estão disponíveis no ambiente): formulário de cliente com endereço estruturado, deep-link `/clientes?nome=...` abrindo o cliente certo, página `/vendas`, Sidebar com botão "Sair", página `/equipe` com a lista de permissões corrigida, e kanban de `/atendimento` com os links de cliente.

## 2026-07-30 — (não commitado)
**Módulo Vendas (`/vendas`): pedidos por item, pipeline de status e integração com o Financeiro**

### Novo `FinanceiroContext` (`src/contexts/FinanceiroContext.tsx`)
- Estado de `transacoes[]` (antes local em `Financeiro.tsx`) extraído para um contexto próprio, seguindo o mesmo padrão do `ClientesContext`. Exporta os tipos `TipoTransacao`, `StatusConta`, `FormaPagamento`, `Pagamento`, `Transacao` e os mocks iniciais (mesmos R$ 18.420 em receitas / R$ 7.150 em despesas de antes).
- `FinanceiroProvider` expõe `transacoes`, `addTransacao` (retorna a `Transacao` criada, mesmo padrão de `addCliente`), `deletarTransacao` e `registrarPagamento`. Adicionado em `App.tsx`, entre `ClientesProvider` e `BrowserRouter`.
- `Financeiro.tsx` refatorado para consumir `useFinanceiro()` em vez de manter o array em `useState` próprio — nenhuma mudança de comportamento visual; existe agora para permitir que outros módulos (Vendas) leiam/gravem no mesmo estado financeiro.

### Módulo Vendas (`src/pages/Modules/Vendas.tsx`, novo)
- Pedidos com **itens** (`ItemVenda`: descrição, quantidade, valor unitário) em vez de um valor único — cada venda (`Venda`) tem `cliente` (nome, vinculado via `ClienteSelect`), `itens[]`, `data`, `status` e `observacoes?` opcional. Total é sempre derivado somando `quantidade × valorUnitario` de cada item.
- **Pipeline de status** em 4 etapas fixas, exibido como quadro kanban (mesmo padrão visual do `Service.tsx`/Atendimento): `orcamento` → `aprovado` → `producao` → `entregue`. Cada coluna mostra a contagem de pedidos; cards mostram cliente, total, nº de itens e data.
- 3 cards de resumo no topo (mesmo padrão do Financeiro): **Em orçamento**, **Em carteira** (aprovado + em produção) e **Entregue**, cada um somando o total das vendas no respectivo grupo de status.
- **`NovaVendaModal`**: `ClienteSelect` + lista dinâmica de itens (adicionar/remover linhas, cada linha com descrição/quantidade/valor unitário e subtotal calculado ao vivo), Data e Observações. Toda venda nova começa em `status: "orcamento"`. Validação manual por item (descrição obrigatória, quantidade e valor > 0) e exige ao menos 1 item.
- **`DetalheVendaModal`**: lista os itens do pedido, mostra observações quando houver, e expõe um botão para avançar para a próxima etapa do pipeline (rótulo contextual: "Aprovar orçamento" / "Iniciar produção" / "Marcar como entregue"). Etapas não retrocedem pela UI. "Cancelar venda" remove o pedido com confirmação em dois passos (mesmo padrão de exclusão do Financeiro/Agenda).
- **Integração com o Financeiro**: ao avançar de `orcamento` para `aprovado` pela primeira vez, é criada automaticamente uma `Transacao` do tipo `receita` no `FinanceiroContext` (`categoria: "venda"`, descrição = nome do cliente, valor = total do pedido, vencimento = data do pedido), e o `id` da transação fica salvo em `venda.transacaoId`. Cancelar uma venda que já tem `transacaoId` também remove a receita correspondente do Financeiro (`deletarTransacao`). Adicionada a categoria `"venda"` → `"Venda"` em `LABEL_CATEGORIA` (`Financeiro.tsx`) para exibir esse rótulo corretamente no modal de detalhe de transação.
- Rota `/vendas` adicionada em `App.tsx`; item **Vendas** (ícone `ShoppingCart`) adicionado à Sidebar entre Clientes e Financeiro.
- Validado rodando a aplicação (Edge headless + `puppeteer-core`, já que não havia `chromium-cli`/Playwright disponíveis no ambiente): criação de venda com múltiplos itens, total calculado corretamente, aprovação de orçamento gerando a receita, e confirmação de que o total de "Entradas" no Financeiro refletiu o valor somado (R$ 18.420 → R$ 19.420 após aprovar um pedido de R$ 1.000) — navegação client-side entre módulos preservando o estado compartilhado. Sem erros de console.

## 2026-07-30 — `1cae5e2`
**Agenda: remoção do campo Serviço do formulário de novo agendamento**

- `NovoAgendamentoModal`: campo **Serviço** (Select com lista fixa de serviços e ponto colorido) removido do formulário, a pedido do usuário. Removidas junto as constantes que só existiam para esse campo: `SERVICOS`, `DURACAO_POR_SERVICO`, `COR_DOT_POR_SERVICO`/`COR_DOT_PADRAO`, `CORES_POR_SERVICO`/`COR_PADRAO` (consolidada em `COR_EVENTO_PADRAO`, cor fixa para todo evento novo) e a função `renderServico`.
- Duração do evento passou a usar sempre `DURACAO_PADRAO` (60 min) ao preencher automaticamente o campo **Fim** a partir do **Início** — antes variava por serviço selecionado. O campo Fim continua editável manualmente.
- Tipo `Evento` (`Agenda.tsx`) perdeu o campo `servico: string`. Mocks iniciais (`eventosIniciais`) atualizados.
- `EventoCard` (card do evento no grid Dia/Semana) passou a exibir o **profissional** abaixo do nome do cliente, no lugar do serviço.
- `DetalheEventoModal`: cabeçalho colorido, que mostrava "Serviço" + valor, passou a mostrar **Profissional**; a linha "Profissional" que existia mais abaixo no corpo do modal foi removida (ficaria duplicada com o cabeçalho).
- `tsc -b` e `npm run lint` validados sem novos erros. Commitado e enviado para `origin/main`.

## 2026-07-15 — (não commitado)
**Agenda e Financeiro: vinculação de clientes e fluxo completo de pagamentos**

### Contexto compartilhado de clientes (`ClientesContext`)
- Criado `src/contexts/ClientesContext.tsx`: centraliza o estado da lista de clientes (antes isolado em `Clientes.tsx`). Exporta tipos `Cliente`, `AgendamentoHistorico`, `StatusAgendamento`, a constante `CORES_AVATAR_CLIENTES` e os mocks iniciais.
- `ClientesProvider` gerencia `clientes[]`, `addCliente` (retorna o `Cliente` criado) e `deletarCliente`. Adicionado em `App.tsx` envolvendo toda a aplicação, dentro de `AuthProvider`.
- `Clientes.tsx` refatorado para consumir `useClientes()` em vez de manter estado local próprio.

### Componente compartilhado `ClienteSelect` (`src/components/ClienteSelect.tsx`)
- Novo componente reutilizável: campo de busca com dropdown inline filtrando clientes por nome ou telefone; exibe avatar colorido + nome + telefone em cada opção.
- Quando nenhum cliente corresponde à busca (ou a lista está vazia), exibe **"+ Novo cliente"** que abre `NovoClienteRapido` — mini-modal com campos Nome e Telefone. O cliente criado é adicionado ao contexto e automaticamente selecionado no campo.
- Após seleção, exibe o card compacto do cliente com avatar, nome, telefone e botão × para desfazer.
- Fechamento do dropdown ao clicar fora via `useRef` + listener `mousedown` no `document`.
- Importado por `NovoAgendamentoModal` e `Financeiro`; componentes locais duplicados removidos de `NovoAgendamentoModal.tsx`.

### Agenda: campo "Cliente" vinculado ao módulo Clientes
- `NovoAgendamentoModal`: campo "Cliente" substituído de `Input` de texto livre para `ClienteSelect`. O nome do cliente selecionado popula o campo `nome` do `Evento`. Novo cliente criado via modal rápido aparece imediatamente na lista de Clientes (estado compartilhado via contexto).

### Financeiro: campo "Cliente" em "Nova receita"
- Campo "Descrição" do formulário de nova receita substituído por `ClienteSelect`. O nome do cliente selecionado é salvo como `descricao` da transação — compatível com listagem, filtros por busca e modal de detalhe.
- Despesas mantêm o campo "Descrição" como texto livre (sem vínculo a cliente).

### Financeiro: remoção do campo Status nos formulários
- "Nova receita" e "Nova despesa": campo **Status** removido. Toda transação nova é criada com `status: "em_dia"`. O status só pode mudar via registro de pagamentos (receitas/despesas) no `DetalheTransacaoModal`.
- Constante `STATUS_OPCOES`, estado `status` e `setStatus` removidos do `NovaTransacaoModal`.

### Financeiro: registro de pagamentos com formas e histórico
- Novo tipo `FormaPagamento: "dinheiro" | "cartao" | "pix" | "cheque" | "ted"`.
- Novo tipo `Pagamento: { id, valor, data: string (YYYY-MM-DD), forma: FormaPagamento }`.
- `Transacao` recebe campo opcional `pagamentos?: Pagamento[]`.
- `DetalheTransacaoModal` ganha seção de pagamentos (presente em receitas **e** despesas), separada do rodapé de exclusão por um divisor:
  - **Barra de progresso** — aparece quando `valorPago > 0`; exibe "Valor recebido / pago · R$ X de R$ Y" e barra teal com preenchimento proporcional animado.
  - **Histórico de recebimentos/pagamentos** — lista cada entrada com data, badge de forma (ícone + label) e valor (`+ R$` teal para receitas, `− R$` vermelho para despesas). Scroll interno `max-h-36` quando há muitos registros.
  - **Formulário de registro** — visível enquanto `status !== "pago"`:
    - Chips de forma de pagamento em `grid-cols-5`: Dinheiro (`Banknote`), Cartão (`CreditCard`), Pix (`QrCode`), Cheque (`FileText`), TED (`ArrowLeftRight`). Chip selecionado fica com borda e fundo teal.
    - Campo Valor pré-preenchido com o saldo restante; campo Data pré-preenchido com hoje (`hojeISO()`).
    - Validação: forma obrigatória, valor > 0, valor ≤ saldo restante (`formatBRL(valorRestante)` na mensagem de erro), data obrigatória.
  - **Marcação automática como "pago"**: quando `somaPagamentos >= valorTotal − 0.001`, `status` é atualizado para `"pago"`, o formulário desaparece e o badge na lista atualiza imediatamente.
- Função `registrarPagamento(id, pag)` adicionada ao `Financeiro`; atualiza o array de pagamentos e recalcula o status.
- `transacaoExibida` derivado de `transacoes.find(t => t.id === transacaoSelecionada.id)` garante que o modal sempre reflita o estado mais recente após cada registro de pagamento sem precisar re-selecionar o item na lista.

---

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
