# Regras de Negócio

Este documento descreve as regras de negócio **efetivamente implementadas no código** hoje. Onde o comportamento depende de dados mockados (sem persistência real), isso é indicado explicitamente.

## Autenticação

1. Login é feito por **usuário** (não e-mail) + senha (`POST /auth/login`).
2. Apenas usuários com `ativo = TRUE` podem autenticar.
3. Senha é validada via hash bcrypt; senha incorreta e usuário inexistente retornam a **mesma mensagem genérica** ("Usuário ou senha inválidos") — escolha deliberada para não revelar qual usuário existe.
4. Token JWT emitido tem payload `{ id, empresaId }` e expira em **15 minutos**, sem refresh token.
5. Usuários pertencem a uma empresa (`empresaId`), indicando um modelo multi-tenant — mas nenhuma regra de isolamento por empresa está implementada em nenhum endpoint hoje (não há módulos de negócio no backend ainda para aplicá-la).

## Recuperação de senha

Fluxo composto por 4 passos, todos client-driven (o frontend decide a navegação entre etapas usando `localStorage` como estado de sessão):

1. **Solicitação** (`/recuperar-senha` → `POST /auth/forgot-password`): valida que o usuário existe e está ativo.
2. **Envio de código** (`POST /auth/send-reset-code`, chamado automaticamente após o passo 1, e também disponível como "Reenviar Código" na tela seguinte): dispara webhook para o n8n, que (presumivelmente, fora deste repositório) gera o código e o envia via **WhatsApp**.
3. **Verificação de código** (`/verificar-codigo` → `POST /auth/verify-code`): código de **6 dígitos numéricos**; válido apenas se não foi usado (`utilizado = FALSE`) e não expirou (`expiracao > NOW()`); ao validar, é marcado como utilizado (uso único).
4. **Redefinição de senha** (`/resetar-senha` → `POST /auth/reset-password`): exige nova senha + confirmação iguais no frontend; o backend apenas recebe `usuario` + `novaSenha` e atualiza o hash — **não reverifica no servidor se o código foi de fato validado** (essa garantia hoje depende só da flag `@aura:code-validated` no `localStorage` do navegador, que é uma proteção fraca contra manipulação direta da API). Ver Pendências/risco.

## Módulo Atendimento (`/atendimento`)

Implementado como um pipeline (Kanban). **Desde 2026-08-27, os dados são reais** — `Service.tsx` busca `GET /chats` (backend, ver [backend.md](./backend.md)) em vez de usar o array hardcoded de antes.

- **Colunas dinâmicas**: as 6 colunas fixas do mockup original (Início/Agendamento/Cancelamento/Pagamento/Atendimento Humano/Concluído) foram abandonadas — não havia como mapear esses rótulos, inventados para a demo, para o valor real da coluna `chats.etapa` (texto livre controlado pelo bot do n8n; hoje só existe o valor `selecao_opcao` nos dados). As colunas agora são geradas a partir dos valores distintos de `etapa` presentes na resposta da API, com o rótulo humanizado (`selecao_opcao` → "Selecao Opcao").
- Cada card mostra: nome do cliente (via `LEFT JOIN` com `clientes_copy` no backend, com fallback para o número de telefone se não houver cliente vinculado), horário (`HH:mm` se for hoje, `dd/MM` caso contrário) e a última mensagem (`chats_copy.ultima_mensagem`).
- Clicar no nome do cliente em qualquer card leva para `/clientes?clienteId=...` — link exato, já que `chats_copy.cliente_id` aponta para `clientes_copy.id` (mesma tabela usada por `ClientesContext`).
- Ainda **não há**: movimentação entre colunas (sem drag-and-drop), criação/edição de chat pela UI (`GET /chats` é somente leitura), nem paginação/filtro.

## Módulo Agenda (`/agenda`)

Calendário com **três visualizações** (toggle segmentado no header): **Dia**, **Semana** (padrão) e **Mês**. Dados mockados em estado local (`useState`), sem backend ainda. Navegação (← Hoje →) adaptada por view (navega por dia, semana ou mês conforme a view ativa).

### Tipo `Evento`
Cada evento tem: cliente, profissional responsável, data absoluta (`data: Date`), hora de início fracionária (ex. `15.5` = 15h30), duração em horas (calculada da diferença Fim − Início no formulário), cor (fixa para todo evento novo, `COR_EVENTO_PADRAO`) e observações opcionais. **Não há mais campo de serviço** (removido em 2026-07-30, ver [changelog.md](./changelog.md)).

### Formulário de novo agendamento (`NovoAgendamentoModal`)
- Campos: Cliente, Profissional (com avatar de iniciais), Data, Início, Fim, Observações.
- **Campo "Cliente"** usa o componente `ClienteSelect` — busca filtrada por nome ou telefone na lista do módulo Clientes (via `ClientesContext`). Permite criar um novo cliente diretamente via mini-modal (Nome + Telefone) sem sair do formulário; o cliente criado é automaticamente selecionado e adicionado ao contexto compartilhado.
- **Fim é preenchido automaticamente** ao alterar o Início, somando sempre `DURACAO_PADRAO` (60 min fixos — antes variava por serviço selecionado, campo removido). O campo Fim permanece editável manualmente.
- Validação: todos obrigatórios exceto Observações; `horarioFim > horarioInicio` validado com mensagem específica.
- Lista de Profissional é mock fixo — quando houver módulo de Equipe no backend, deve vir de lá.
- No card do evento (grid Dia/Semana) e no cabeçalho do `DetalheEventoModal`, o **profissional** é exibido no lugar de onde antes aparecia o serviço.

### Bloqueio de horários (`FechaHorarioModal`)
- Acionado pelo botão **"Fechar horário"** (outline, ícone de cadeado) no header da Agenda.
- Campos: Data (início da recorrência), Início, Fim, **Repete** (Não repete / Diariamente / Semanalmente / Quinzenalmente / Mensalmente).
- Tipo `Bloqueio`: `{ id, data: Date, horaInicio: number, horaFim: number, recorrencia: Recorrencia }`.
- Tipo `Recorrencia`: `"nenhuma" | "diaria" | "semanal" | "quinzenal" | "mensal"`.
- Lógica `bloqueioAplicaNoDia(bloqueio, dia)` verifica a regra de recorrência sem imports adicionais (JS Date puro):
  - `nenhuma` → só na data exata.
  - `diaria` → todo dia a partir da data.
  - `semanal` → mesmo `getDay()` a partir da data.
  - `quinzenal` → `diffDias % 14 === 0` a partir da data.
  - `mensal` → mesmo `getDate()` a partir da data.
- **Visualização**: na view Dia/Semana, bloco cinza absoluto com listras diagonais (`repeating-linear-gradient`) e label "Fechado · [Recorrência]" quando há altura suficiente; renderizado em `z-0` (atrás dos eventos em `z-10`). Na view Mês, pill cinza com ícone `Lock` e o intervalo de horário.
- Não há regra de conflito entre bloqueios e eventos (eventos existentes em horário bloqueado continuam aparecendo na frente).

### Layout de eventos sobrepostos (views Dia e Semana)
Quando dois ou mais eventos se sobrepõem no mesmo intervalo de tempo em uma coluna de dia, o grid aplica automaticamente um layout de colunas:
- Eventos são distribuídos horizontalmente em colunas de igual largura (ex.: 2 eventos simultâneos → cada um ocupa 50% da coluna).
- O algoritmo guloso (`calcularLayout`) garante que eventos que não se sobrepõem entre si possam compartilhar a mesma coluna horizontal (ex.: A das 9h–10h e C das 10h–11h ficam na mesma coluna, mesmo que ambos se sobreponham a B das 9h–11h).
- Apenas as views **Dia** e **Semana** usam este layout. A view **Mês** continua exibindo pills independentes (não há colisão vertical no grid mensal).

### Outras regras
- Não há regra de negócio sobre horário de funcionamento do negócio.
- Profissionais continuam sendo strings livres, sem vínculo com cadastro de equipe.

## Módulo Financeiro (`/financeiro`)

Painel financeiro mensal, **100% mockado** (sem backend). Desde 2026-07-30, o estado de `transacoes[]` vive em `FinanceiroContext` (antes era `useState` local do próprio `Financeiro.tsx`) — isso permite que o módulo Vendas grave receitas diretamente no mesmo estado ao aprovar um pedido (ver seção "Módulo Vendas" abaixo). Dados iniciais representam julho de 2026 com R$ 18.420 em receitas e R$ 7.150 em despesas (saldo R$ 11.270).

### Modelo de dados

**`Transacao`**: `id`, `descricao`, `tipo: "receita" | "despesa"`, `valor: number`, `vencimento: "DD/MM"`, `status: "em_dia" | "atrasado" | "pago"`, `pagamentos?: Pagamento[]`.

**`Pagamento`**: `id`, `valor: number`, `data: string (YYYY-MM-DD)`, `forma: FormaPagamento`.

**`FormaPagamento`**: `"dinheiro" | "cartao" | "pix" | "cheque" | "ted"`.

### Cards de resumo

- **Entradas**: soma de todas as transações do tipo `"receita"` no estado. Exibe variação percentual vs. mês anterior (hardcoded "+12%" nos mocks iniciais).
- **Saídas**: soma de todas as transações do tipo `"despesa"`. Variação "-4%" nos mocks iniciais.
- **Saldo**: `totalEntradas - totalSaidas`. Card com fundo azul sólido.
- Os três totais são derivados reativamente do array `transacoes[]` — atualizam ao adicionar novas receitas/despesas.

### Gráfico de fluxo de caixa

SVG puro responsivo com curva bezier suave e gradiente de preenchimento. Dados diários pré-calculados simulam o saldo acumulado ao longo do mês (não reflete dinamicamente as novas transações adicionadas pelo usuário — permanece como dado de referência inicial até integração real com backend).

### Listas de contas

- **Contas a receber**: `transacoes.filter(t => t.tipo === "receita")` — exibe **todas** as receitas, incluindo pagas.
- **Contas a pagar**: `transacoes.filter(t => t.tipo === "despesa")` — exibe **todas** as despesas, incluindo pagas.
- Ambas exibem badge de status (`Pendente` / `Atrasado` / `Pago`).
- Clicar em qualquer linha abre `DetalheTransacaoModal` com as informações completas e opção de exclusão.

### Formulários de nova transação

Botões "+ Nova receita" e "+ Nova despesa" no header abrem o mesmo componente `NovaTransacaoModal` com `tipo` diferente.

**Campos da nova receita** (todos obrigatórios exceto onde indicado):
- **Cliente** — `ClienteSelect`: busca por nome ou telefone; permite criar novo cliente via mini-modal. O nome do cliente selecionado é salvo como `descricao` da transação.
- **Categoria** — Select: "Serviço / Produto / Outros".
- **Valor (R$)** — numérico, ao lado de Categoria (grid 2 colunas).
- **Data** — date picker, largura total.

> Existe também a categoria `"venda"` (rótulo "Venda"), mas ela **não aparece como opção no Select** — só é atribuída automaticamente às receitas geradas pelo módulo Vendas ao aprovar um orçamento (ver abaixo). `LABEL_CATEGORIA` sabe exibi-la corretamente no modal de detalhe.

**Campos da nova despesa** (todos obrigatórios exceto onde indicado):
- **Descrição** — texto livre, largura total.
- **Categoria** — Select: "Custo fixo / Custo variável / Outros".
- **Valor (R$)** — numérico, ao lado de Categoria (grid 2 colunas).
- **Data** — date picker, largura total.

**Regra de status na criação**: o campo Status foi removido de ambos os formulários. Toda transação nova é criada com `status: "em_dia"`. O status só pode mudar para `"pago"` via registro de pagamentos no `DetalheTransacaoModal`.

Ao salvar, a transação é adicionada ao array; totais dos cards atualizam imediatamente.

**Repetição de despesas em parcelas (novo em 2026-08-23)**: apenas no formulário de nova **despesa**, checkbox "Repetir nos próximos meses" revela um campo "Quantos meses (incluindo este)" (inteiro entre 2 e 60, validado). Ao salvar com a repetição ativa, em vez de uma única transação são criadas **N transações independentes** — mesma descrição com sufixo `(i/N)` (ex.: "Aluguel (1/4)", "Aluguel (2/4)"...), mesmo valor e categoria, uma por mês a partir da data informada, preservando o dia do mês (com *clamp* para o último dia quando o mês de destino é mais curto — ex.: dia 31 de janeiro repete em 28/29 de fevereiro). Cada parcela é uma `Transacao` independente no array — não há vínculo entre elas além do padrão de descrição; cancelar/pagar uma não afeta as demais.

### Filtros nas listas de contas

Ambas as listas usam o componente `ListaFiltrada`, que encapsula estado de filtro próprio (cada lista é independente). O cabeçalho de cada card expõe:
- **Campo de busca** — filtra `descricao` em tempo real.
- **Botão "Filtros"** — expande painel com badge de contagem quando há filtros ativos.

O painel expandível oferece:
- **Status** — chips multi-select (Pendente / Atrasado / Pago).
- **Vence** — intervalo de datas (De / Até), comparado via conversão `DD/MM` → `YYYY-MM-DD` assumindo ano 2026.
- **Valor** — intervalo numérico (Mín / Máx).
- **Limpar filtros** — reseta todo o estado quando algum filtro está ativo.

Os filtros se combinam em cascata; a lista respeita `max-h-72` com `overflow-y-auto` para não crescer a página.

### Detalhe, pagamentos e exclusão de transação (`DetalheTransacaoModal`)

Clicar em qualquer item de "Contas a receber" ou "Contas a pagar" abre o modal de detalhe:
- **Cabeçalho colorido** (teal = receita, vermelho = despesa): ícone de tendência, tipo, badge de status, descrição e valor.
- **Campos**: Vencimento e Categoria (com rótulo legível; omitida se não preenchida).

**Seção de pagamentos** (exibida para receitas e despesas):
- **Barra de progresso** — aparece quando há algum pagamento registrado; exibe "R$ pago de R$ total" e barra teal proporcionalmente preenchida.
- **Histórico** — lista pagamentos com data (formatada DD/MM/AAAA), badge de forma (ícone + label) e valor (`+ R$` em teal para receitas, `− R$` em vermelho para despesas). Scroll interno `max-h-36`.
- **Formulário de registro** — visível enquanto `status !== "pago"`:
  - Chips de forma de pagamento em 5 colunas: Dinheiro (`Banknote`), Cartão (`CreditCard`), Pix (`QrCode`), Cheque (`FileText`), TED (`ArrowLeftRight`). Chip ativo fica com borda/fundo teal.
  - Campo **Valor** pré-preenchido com o saldo restante; Campo **Data** pré-preenchido com hoje.
  - Validações: forma obrigatória; valor > 0 e ≤ saldo restante (com precisão de float `0.001`); data obrigatória.
  - Botão "Confirmar recebimento" (receita) / "Confirmar pagamento" (despesa).
- **Auto-marcação como "pago"**: quando `somaPagamentos >= valorTotal − 0.001`, o status muda para `"pago"`, o formulário some e o badge na lista atualiza.
- O estado do formulário de pagamento é resetado ao trocar de transação (`useEffect([transacao?.id])`); o campo Valor é pré-preenchido com o saldo restante atualizado.

**Exclusão em dois passos**: botão "Excluir" (lixeira) → mensagem de confirmação → "Confirmar exclusão" remove o registro do estado local e fecha o modal. "Voltar" cancela a exclusão. O estado de confirmação é resetado automaticamente ao trocar de transação selecionada.

**Atualização reativa**: `DetalheTransacaoModal` recebe `transacao={transacaoExibida}` — derivado de `transacoes.find(t => t.id === selecionada.id)` — garantindo que o modal sempre reflita o estado mais recente após cada pagamento registrado sem precisar fechar e reabrir.

## Módulo Vendas (`/vendas`)

Criado em 2026-07-30. Pedidos de venda **por item** (não um valor único como no Financeiro), com um pipeline de status visual em formato kanban, **100% mockado** (estado local em `Vendas.tsx`, sem backend).

### Modelo de dados

**`Venda`**: `id`, `cliente: string` (nome, preenchido via `ClienteSelect` — mesmo padrão de "Nova receita" no Financeiro), `itens: ItemVenda[]`, `data: string (YYYY-MM-DD)`, `status: StatusVenda`, `observacoes?: string`, `transacaoId?: string` (preenchido quando uma receita já foi gerada no Financeiro para este pedido).

**`ItemVenda`**: `id`, `descricao`, `quantidade: number`, `valorUnitario: number`. O total da venda é sempre **derivado** (`Σ quantidade × valorUnitario` de todos os itens), nunca armazenado como campo próprio.

**`StatusVenda`**: `"orcamento" | "aprovado" | "producao" | "entregue"` — pipeline linear fixo, sem etapas paralelas ou customizáveis.

### Pipeline (quadro kanban)

- 4 colunas fixas, na ordem: **Orçamento** → **Aprovado** → **Em produção** → **Entregue**. Cada venda aparece em exatamente uma coluna, de acordo com `status`.
- Cards mostram cliente, total, quantidade de itens e data do pedido; clicar abre o `DetalheVendaModal`.
- **O avanço de etapa só acontece para frente** — não há botão de "voltar etapa" na UI (decisão deliberada: uma vez aprovado um orçamento e gerada a receita correspondente no Financeiro, retroceder geraria inconsistência entre os dois módulos).
- 3 cards de resumo no topo da página: **Em orçamento** (soma + contagem dos pedidos em `orcamento`), **Em carteira** (soma + contagem de `aprovado` + `producao`) e **Entregue** (soma + contagem de `entregue`).

### Nova venda (`NovaVendaModal`)

- Campos: Cliente (`ClienteSelect`), lista de Itens (dinâmica — botão "Adicionar item", cada linha com Descrição/Quantidade/Valor unitário e um botão para remover a linha, mínimo de 1 item), Data, Observações (opcional).
- Total é recalculado ao vivo conforme os itens são preenchidos.
- Validação manual: cliente obrigatório; cada item precisa de descrição não vazia, quantidade > 0 e valor unitário > 0; é preciso ao menos 1 item na lista.
- Toda venda nova é criada com `status: "orcamento"` — não é possível criar uma venda diretamente em outra etapa pela UI.

### Detalhe da venda e avanço de etapa (`DetalheVendaModal`)

- Mostra a lista completa de itens (descrição, quantidade × valor unitário, subtotal) e as observações, quando houver.
- Botão de ação principal com rótulo contextual conforme o status atual: **"Aprovar orçamento"** (orçamento → aprovado), **"Iniciar produção"** (aprovado → produção), **"Marcar como entregue"** (produção → entregue). Não aparece nenhum botão de avanço quando o status já é "Entregue" (fim do pipeline).
- **"Cancelar venda"** — exclusão com confirmação em dois passos, mesmo padrão usado no Financeiro (`DetalheTransacaoModal`) e na Agenda (`DetalheEventoModal`). Se a venda já tinha gerado uma receita no Financeiro (`transacaoId` preenchido), a confirmação avisa que a receita também será removida.

### Integração com o Financeiro

- Ao avançar de **"Orçamento" para "Aprovado" pela primeira vez**, o módulo cria automaticamente uma `Transacao` do tipo `receita` no `FinanceiroContext` compartilhado: `descricao` = nome do cliente, `categoria: "venda"`, `valor` = total do pedido, `vencimento` = data do pedido (convertida para `DD/MM`), `status: "em_dia"`. O `id` da transação criada é salvo em `venda.transacaoId`, evitando gerar uma segunda receita se o pedido avançar/retroceder ou se o usuário reabrir o modal.
- Essa receita passa a existir normalmente dentro do Financeiro — aparece em "Contas a receber", entra nos totais de "Entradas"/"Saldo" e no fluxo de recebimento de pagamentos (`DetalheTransacaoModal`) como qualquer outra receita.
- Cancelar a venda depois de aprovada (`transacaoId` preenchido) também chama `deletarTransacao(transacaoId)` no Financeiro, removendo a receita vinculada.
- Etapas seguintes do pipeline (produção, entrega) **não** geram nenhum lançamento financeiro adicional — só a transição orçamento → aprovado dispara a criação da receita.

## Estado compartilhado de clientes (`ClientesContext`)

`src/contexts/ClientesContext.tsx` centraliza a lista de clientes, eliminando estado local duplicado que existia antes em `Clientes.tsx`.

- **Tipos exportados**: `StatusAgendamento`, `AgendamentoHistorico`, `Endereco` (novo em 2026-08-23: `cep?`, `rua?`, `numero?`, `complemento?`, `bairro?`, `cidade?`, `estado?`, todos opcionais), `Cliente` (id, nome, telefone, `cpfCnpj?`, `email?`, `endereco?: Endereco`, avatarCor, agendamentos[]).
- **`ClientesProvider`** (real desde 2026-08-27, antes era mock): busca `GET /clientes` num `useEffect` ao montar e mantém o resultado em `clientes[]`; expõe `carregando: boolean` até a resposta chegar. `addCliente` é assíncrono — chama `POST /clientes` e usa o cliente retornado pela API (com `id` real do banco) em vez de gerar um UUID local. `deletarCliente` remove otimista do estado local e dispara `DELETE /clientes/:id` em paralelo (loga no console se falhar, sem repor o item na UI). `agendamentos` e `avatarCor` continuam sendo campos só-de-frontend — não existem no banco, então `agendamentos` sempre vem `[]` de dados reais e `avatarCor` é calculado por índice na lista.
- **Quem consome**: `Clientes.tsx` (listagem e exclusão), `ClienteSelect.tsx` (busca e criação rápida — via o componente compartilhado `NovoClienteModal`, ver abaixo), indiretamente `NovoAgendamentoModal`, `Financeiro` e `Vendas` via `ClienteSelect`.
- **Retorno do `addCliente`**: retorna o cliente confirmado pela API, permitindo que `ClienteSelect`/`NovoClienteModal` auto-selecione o cliente recém-cadastrado sem precisar encontrá-lo na lista depois.

## Componente compartilhado `NovoClienteModal` (novo em 2026-08-23)

`src/components/NovoClienteModal.tsx` — formulário completo de criação de cliente, extraído de `Clientes.tsx` para ser reutilizado em qualquer lugar do sistema onde um cliente pode ser criado "na hora" (via `ClienteSelect`).

- Autocontido: usa `useClientes()` internamente para chamar `addCliente` e calcular a cor do avatar (`CORES_AVATAR_CLIENTES[clientes.length % ...]`) — o caller só precisa de `isOpen`, `onClose` e, opcionalmente, `onCreated(cliente)`.
- Campos: Nome, Telefone (obrigatórios); CPF/CNPJ, E-mail e Endereço — CEP, Número, Rua, Complemento, Bairro, Cidade, UF, cada um em seu próprio input (opcionais). Endereço só é salvo no cliente se pelo menos um dos sete campos foi preenchido.
- Usado por `Clientes.tsx` (botão "Adicionar cliente") e por `ClienteSelect.tsx` (botão "+ Novo cliente" dentro do dropdown de busca — usado em `NovoAgendamentoModal`, "Nova receita" do Financeiro e `NovaVendaModal`). Antes, `ClienteSelect` tinha seu próprio mini-formulário (`NovoClienteRapido`, só Nome + Telefone) — removido em favor deste componente único, garantindo que o cliente criado a partir de qualquer módulo já tenha os mesmos campos disponíveis em `/clientes`.
- **Desde 2026-08-27, o submit é assíncrono e persiste de verdade** (`POST /clientes`, ver [backend.md](./backend.md)): botão mostra "Salvando…" e fica desabilitado durante a chamada; se a API falhar, aparece uma mensagem de erro no formulário em vez de fechar o modal como se tivesse dado certo.

## Módulo Clientes (`/clientes`)

Lista de clientes cadastrados. **Desde 2026-08-27, os dados são reais** (`ClientesContext` busca `GET /clientes`) — antes era 100% mockado. É um consumer puro do contexto — não mantém estado próprio de dados.

- Exibição em grid de cards com avatar colorido (iniciais), nome, telefone e histórico de agendamentos. Mostra "Carregando clientes…" enquanto a lista ainda não chegou da API.
- Criação via `NovoClienteModal` (ver acima) — Nome, Telefone, CPF/CNPJ, E-mail, Endereço. Persiste no banco (`clientes_copy` + `enderecos`, nunca nas tabelas live — ver [database.md](./database.md)).
- `DetalheClienteModal`: cabeçalho (avatar, nome, telefone) + histórico de agendamentos + seção **"Dados pessoais"** sempre visível (CPF/CNPJ, E-mail, Endereço formatado — com "—" quando o campo não foi preenchido, desde 2026-08-23).
- Exclusão com confirmação de dois passos — persiste de verdade desde 2026-08-27 (`DELETE /clientes/:id`), removida otimista da tela antes da resposta da API chegar.
- Clientes criados aqui aparecem imediatamente disponíveis em `NovoAgendamentoModal`, "Nova receita" no Financeiro e `NovaVendaModal`.
- **`agendamentos` sempre vem vazio** para clientes reais — não existe uma tabela de agendamentos ligada a `clientes_copy` consumida ainda pelo frontend (a Agenda continua com seu próprio estado local mockado, sem relação com este histórico). Ver Pendências.

### Abertura automática via link de outro módulo (novo em 2026-08-23)

A página lê os parâmetros de busca da URL (`useSearchParams`) num `useEffect`:
- `?clienteId=<id>` — abre diretamente o `DetalheClienteModal` do cliente com esse id, se existir na lista.
- `?nome=<nome>` (fallback, usado quando o registro de origem não tem `clienteId`) — se houver um cliente com nome exatamente igual (case-insensitive), abre o modal dele; senão, apenas pré-preenche o campo de busca com esse nome.
- Os parâmetros são removidos da URL (`replace: true`) depois de processados, para não reabrir o modal ao navegar dentro da própria página de Clientes.
- Ver "Navegação cliente → cadastro", abaixo, para quem gera esses links.

## Módulo Configurações (`/configuracoes`)

Criado em 2026-08-23 (`src/pages/Modules/Configuracoes.tsx`). O item já existia no menu da Sidebar antes disso, mas sem página/rota correspondente. **100% mockado**, sem persistência.

- Duas abas apenas, em pill de abas: **Empresa** e **Integrações** — a pedido explícito do usuário, o mockup de referência tinha mais abas (Serviços, Agenda, Chatbot) que **não** foram implementadas.
- **Empresa**: formulário com Nome da empresa (pré-preenchido com "Marmoraria Decore Granitos"), CNPJ (opcional), Telefone, E-mail e Endereço com os mesmos sete campos separados do módulo Clientes (CEP, Número, Rua, Complemento, Bairro, Cidade, UF). Botão "Salvar alterações" só atualiza o estado local do componente (mostra uma confirmação textual) — nada é persistido entre navegações.
- **Integrações**: lista fixa de 3 integrações mockadas — **WhatsApp (via n8n)** (conectado por padrão, remete à recuperação de senha via WhatsApp já existente no fluxo de Auth), **Google Agenda** e **Webhook personalizado** (ambas desconectadas por padrão). Cada linha tem um botão Conectar/Desconectar que só alterna um badge de status local — nenhuma chamada real é feita.

## Navegação cliente → cadastro (novo em 2026-08-23)

Onde Agenda, Financeiro, Vendas e Atendimento fazem referência a um cliente, essa referência é clicável e leva o usuário para `/clientes`, abrindo automaticamente o `DetalheClienteModal` daquele cliente (ver "Abertura automática via link de outro módulo" na seção do módulo Clientes):

- **Agenda** — `DetalheEventoModal`: campo "Cliente" é um botão (ícone de seta) que navega usando `evento.clienteId` quando disponível, ou `evento.nome` como fallback.
- **Financeiro** — `DetalheTransacaoModal`: só para **receitas** (despesas nunca têm cliente vinculado — descrição é sempre texto livre); o nome do cliente (guardado em `transacao.descricao`) vira link, usando `transacao.clienteId` ou `transacao.descricao` como fallback.
- **Vendas** — `DetalheVendaModal`: nome do cliente no cabeçalho colorido vira link, usando `venda.clienteId` ou `venda.cliente` como fallback.
- **Atendimento** — `AtendimentoCard` (kanban): nome do cliente em cada card vira link. Como os "atendimentos" são dados 100% mockados e nunca vinculados a um `Cliente` real (não passam por `ClienteSelect`), o link usa **sempre** o nome (`atendimento.nome`) — não existe `clienteId` neste módulo.
- `Evento` (Agenda), `Transacao` (Financeiro) e `Venda` (Vendas) ganharam campo opcional `clienteId?: string`, preenchido automaticamente a partir do `Cliente` escolhido em `ClienteSelect` no respectivo formulário de criação. Eventos/transações/vendas mockados (dados iniciais) não têm esse campo, então seus links sempre caem no fallback por nome — que só encontra o cliente se o nome mockado bater exatamente com um nome em `ClientesContext` (nem sempre é o caso, já que os mocks de cada módulo foram criados independentemente).

## Sidebar e sessão

- Botão **"Sair"** fixo no rodapé da Sidebar (abaixo do menu, separado por borda), em vermelho. Chama `useAuth().logout()` (limpa `@aura:token`/`@aura:user` do `localStorage` e zera o estado do `AuthContext`) e navega para `/` (Login). Continua acessível (só o ícone, com tooltip) quando a Sidebar está colapsada.
- Isso é o **único** ponto de logout do sistema hoje — antes não existia nenhuma forma de encerrar sessão pela UI.

## Navegação / menu (Sidebar)

O menu lateral (`Sidebar.tsx`) lista as seções do sistema. Rotas implementadas: **Atendimento** (`/atendimento`), **Agenda** (`/agenda`), **Clientes** (`/clientes`), **Vendas** (`/vendas`), **Financeiro** (`/financeiro`), **Equipe** (`/equipe`) e **Configurações** (`/configuracoes`, desde 2026-08-23).

## Módulo Equipe (`/equipe`) — permissões

A lista de permissões exibida por usuário (`PERMISSOES_CONFIG`) foi corrigida em 2026-08-23 para refletir **exatamente** as abas reais do sistema: Atendimento, Agenda, Clientes, Vendas, Financeiro, Equipe e Configurações. Antes incluía `"dashboard"` (aba inexistente) e não tinha Clientes, Vendas nem Equipe como opções — bug de dados desde a criação do módulo, não uma remoção de funcionalidade.

## Pendências

- Confirmar a regra de negócio real de cada estágio do pipeline de Atendimento (em especial "Cancelamento", cujos dados mock parecem inconsistentes com o nome do estágio).
- Confirmar se existe (ou é esperado) algum SLA, prazo ou notificação automática associada a cada estágio do atendimento.
- Confirmar se o reset de senha deveria ter uma segunda verificação no backend (ex.: exigir o `codigo` validado novamente, ou um token de uma única vez emitido após `verify-code`) antes de aceitar `POST /auth/reset-password` — hoje a única barreira é client-side.
- Confirmar regras de conflito de horário/agenda (dois agendamentos no mesmo profissional e horário) e horário de funcionamento do negócio.
- Confirmar se "Atendimento Humano" implica em alguma automação/bot de atendimento (ex.: IA conversacional) anterior a esse estágio — o nome do domínio do n8n (`n8n.aura-ia.cloud`) e da plataforma de banco (`aura-ia.cloud`) sugerem uso de IA em algum ponto do funil, mas não há código deste repositório que implemente isso.
- Confirmar regras de multi-tenancy: como o isolamento por `empresaId` deve se aplicar às próximas funcionalidades de negócio (atendimento, agenda, financeiro, equipe, vendas).
- Confirmar se a receita gerada automaticamente ao aprovar uma venda deveria ter um `vencimento` diferente da data do pedido (ex.: prazo de pagamento configurável), hoje é sempre a mesma data.
- Confirmar se etapas do pipeline de Vendas deveriam permitir retroceder (hoje só avançam) e se deveria ser possível reabrir/estornar uma venda "Entregue".
- Definir se os dados da aba "Empresa" em Configurações deveriam persistir de fato (hoje o botão "Salvar alterações" só atualiza estado local do componente, perdido ao navegar para outra página).
- Confirmar se as integrações listadas em Configurações (WhatsApp/n8n, Google Agenda, Webhook) são as reais a serem suportadas, e o que "conectar" deveria de fato disparar quando houver backend.
- As parcelas geradas pela repetição de despesas no Financeiro são transações totalmente independentes (sem `grupoRecorrencia` ou campo equivalente) — confirmar se será necessário no futuro editar/excluir todas as parcelas de uma vez, o que exigiria um campo de vínculo entre elas.
- Agenda, Financeiro e Vendas ainda mantêm seus próprios nomes de cliente mockados (não vêm de `ClientesContext`), que nem sempre coincidem com os clientes reais agora exibidos em `/clientes` — por isso alguns links "ver cliente" em dados de exemplo desses três módulos não encontram correspondência. Atendimento não tem mais esse problema desde 2026-08-27 (usa `chats_copy.cliente_id`, que aponta para o mesmo `clientes_copy` consumido por `ClientesContext`). Isso se resolve organicamente à medida que Agenda/Financeiro/Vendas também passem a consumir dados reais; não é um bug de código.
- **Não identificado**: em algum momento de 2026-08-27, `chats_copy` e `empresas_copy` foram esvaziadas (0 linhas) e `clientes_copy` perdeu 2 dos 3 registros que tinha, sem que nenhuma query deste backend explicasse isso. Ver Pendências em [database.md](./database.md) — o usuário vai investigar a causa antes de recriar os dados.
- Nenhuma rota de `/clientes` ou `/chats` aplica escopo por `empresa_id` — hoje qualquer usuário (mesmo sem estar autenticado, já que não há middleware de JWT nessas rotas ainda) vê/altera todos os clientes de `clientes_copy`, de todas as empresas. Ver Pendências em [backend.md](./backend.md).
- `Cliente.agendamentos` sempre vem vazio para clientes reais (não existe integração entre `clientes_copy` e uma tabela de agendamentos consumida pelo frontend) — o histórico de agendamentos mostrado em `DetalheClienteModal` nunca aparece preenchido para um cliente criado a partir de 2026-08-27 em diante.
