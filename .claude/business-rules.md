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

Implementado como um pipeline (Kanban) com **6 estágios fixos**, hoje **100% mockado** (array hardcoded em `Service.tsx`, sem chamada de API):

1. **Início** — novo contato do cliente.
2. **Agendamento** — cliente solicitou/está agendando um horário.
3. **Cancelamento** — cliente solicitou cancelamento.
4. **Pagamento** — atendimento aguardando pagamento.
5. **Atendimento Humano** — conversa escalada para um atendente humano (sugere que parte do atendimento inicial pode ser automatizado/bot, possivelmente também via n8n, dado o restante do projeto).
6. **Concluído** — atendimento finalizado.

Cada cliente no pipeline tem: nome, horário (ou rótulo relativo como "Ontem") e a última mensagem trocada. Não há, no código atual: movimentação entre colunas (sem drag-and-drop), clique para abrir detalhes, nem qualquer persistência — é puramente uma visualização estática de exemplo.

**Inconsistência nos dados mock observada**: os cards listados na coluna "Cancelamento" (ex.: "Pedro Lima — Barba — confirmado", "Ana Costa — Corte feminino") descrevem agendamentos confirmados, não cancelamentos — provavelmente um placeholder de dados que não reflete a regra de negócio real da etapa. Ver Pendências.

## Módulo Agenda (`/agenda`)

Calendário com **três visualizações** (toggle segmentado no header): **Dia**, **Semana** (padrão) e **Mês**. Dados mockados em estado local (`useState`), sem backend ainda. Navegação (← Hoje →) adaptada por view (navega por dia, semana ou mês conforme a view ativa).

### Tipo `Evento`
Cada evento tem: cliente, serviço, profissional responsável, data absoluta (`data: Date`), hora de início fracionária (ex. `15.5` = 15h30), duração em horas (calculada da diferença Fim − Início no formulário), cor por serviço e observações opcionais.

### Formulário de novo agendamento (`NovoAgendamentoModal`)
- Campos: Cliente, Serviço (com ponto colorido por tipo), Profissional (com avatar de iniciais), Data, Início, Fim, Observações.
- **Fim é preenchido automaticamente** ao selecionar o serviço ou alterar o Início, com base em `DURACAO_POR_SERVICO` (Corte feminino: 60 min, Corte masculino: 45 min, Barba: 30 min, Avaliação: 30 min, Manicure: 60 min). O campo Fim permanece editável.
- Validação: todos obrigatórios exceto Observações; `horarioFim > horarioInicio` validado com mensagem específica.
- Listas de Serviço e Profissional são mocks fixos — quando houver módulo de Equipe/Serviços no backend, devem vir de lá.

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

### Outras regras
- Não há regra de negócio sobre horário de funcionamento ou conflito de agendamentos (overlap).
- Profissionais continuam sendo strings livres, sem vínculo com cadastro de equipe.

## Navegação / menu (Sidebar)

O menu lateral (`Sidebar.tsx`) lista 6 seções: Dashboard, Atendimento, Agenda, Financeiro, Equipe, Configurações — mas apenas **Atendimento** e **Agenda** têm página/rota implementada hoje. As demais (Dashboard, Financeiro, Equipe, Configurações) aparecem no menu mas não têm rota correspondente em `App.tsx` (ver [roadmap.md](./roadmap.md)).

## Pendências

- Confirmar a regra de negócio real de cada estágio do pipeline de Atendimento (em especial "Cancelamento", cujos dados mock parecem inconsistentes com o nome do estágio).
- Confirmar se existe (ou é esperado) algum SLA, prazo ou notificação automática associada a cada estágio do atendimento.
- Confirmar se o reset de senha deveria ter uma segunda verificação no backend (ex.: exigir o `codigo` validado novamente, ou um token de uma única vez emitido após `verify-code`) antes de aceitar `POST /auth/reset-password` — hoje a única barreira é client-side.
- Confirmar regras de conflito de horário/agenda (dois agendamentos no mesmo profissional e horário) e horário de funcionamento do negócio.
- Confirmar se "Atendimento Humano" implica em alguma automação/bot de atendimento (ex.: IA conversacional) anterior a esse estágio — o nome do domínio do n8n (`n8n.aura-ia.cloud`) e da plataforma de banco (`aura-ia.cloud`) sugerem uso de IA em algum ponto do funil, mas não há código deste repositório que implemente isso.
- Confirmar regras de multi-tenancy: como o isolamento por `empresaId` deve se aplicar às próximas funcionalidades de negócio (atendimento, agenda, financeiro, equipe).
