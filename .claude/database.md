# Banco de Dados

## Sistema

- **SGBD**: PostgreSQL 17 (Debian), hospedado em `easypanel.aura-ia.cloud:5432`, banco `n8n`.
- **Driver**: `pg` (node-postgres), sem ORM — todas as queries são SQL puro com parâmetros posicionais (`$1`, `$2`, ...).
- **Conexão**: pool único (`src/config/database.ts`), configurado via variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- **Não há migrations, seeds ou arquivo de schema (`.sql`) neste repositório.** O schema abaixo foi confirmado por acesso direto ao banco em 2026-08-27 (`information_schema.columns`), não só inferido do código.

## Confirmado: o banco é compartilhado com o n8n em produção

Pendência histórica resolvida em 2026-08-27: o banco `n8n` em `easypanel.aura-ia.cloud` é **o mesmo banco físico usado pela instância n8n real** — 128 tabelas no schema `public`, misturando:

- **Tabelas internas do n8n**: `workflow_entity`, `execution_entity`, `credentials_entity`, `agent_*`, `chat_hub_*`, `instance_ai_*`, `oauth_*`, etc. (a maioria das 128 tabelas).
- **Tabelas de negócio deste app**: `usuarios`, `empresas`, `clientes`, `chats`, `agendamentos`, `servicos`, `cargos`, `permissoes`, `cargos_por_usuario`, `permissoes_por_usuario`, `recuperacao_senha`, `frases`, `instancia_por_empresa`.

**Isso significa que `clientes`, `chats` e `empresas` recebem escritas em tempo real** de conversas reais de WhatsApp processadas pelo bot n8n — não é um banco de desenvolvimento isolado.

## Regra de ouro: o backend deste projeto só usa as tabelas `_copy`

Por causa do parágrafo acima, `clientes`, `chats` e `empresas` foram duplicadas (estrutura + dados, via `CREATE TABLE "<nome>_copy" (LIKE "<nome>" INCLUDING ALL)`) em `clientes_copy`, `chats_copy` e `empresas_copy`. **O backend deste app (`aura-meu-negocio-backend`) só pode ler e escrever nessas tabelas `_copy` — nunca nas tabelas live.** `LIKE ... INCLUDING ALL` não copia foreign keys, então as tabelas `_copy` são estruturalmente independentes das tabelas live (nenhuma FK cruza as duas).

Essa regra está registrada como memória de projeto (fora do repositório, para persistir entre sessões) e deve ser respeitada em qualquer novo código, migração ou script que toque neste banco. Duas exceções observadas:
- `enderecos` (nova, criada em 2026-08-27) não precisa de sufixo `_copy` — não existe uma tabela `enderecos` live para colidir.
- `agendamentos_copy` **já existia no banco antes de qualquer trabalho desta sessão em 2026-08-29** — foi criada por fora (não por este backend), já seguindo a convenção `_copy`. `usuarios` continua sendo lida diretamente da tabela live (não é uma das três tabelas da regra, e já era lida por `auth.service.ts` para login desde antes) — só leitura (`SELECT id, nome`), nunca escrita.

**Achado não resolvido, piorando (2026-08-27 → 2026-08-29)**: `chats_copy`, `empresas_copy` e `clientes_copy` têm apresentado contagem de linhas instável desde 2026-08-27 (visto indo a 0 e voltando entre sessões); em 2026-08-29, o mesmo padrão foi observado também em `agendamentos_copy` (vazia na maior parte dos testes). Não foi identificada nenhuma query deste backend capaz de causar isso (os únicos `DELETE` existentes sempre têm `WHERE id = $1`). Usuário vai investigar a causa antes de recriar os dados — ver Pendências.

## Tabelas de negócio confirmadas

### `usuarios`

Também usada como cadastro de **profissionais** desde 2026-08-29 (`GET /usuarios`, ver [backend.md](./backend.md)) — não existe uma tabela `profissionais` separada; um profissional é só um usuário com `ativo = TRUE`.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid (PK) | Usado no payload do JWT, como FK em `recuperacao_senha.usuario_id` e em `agendamentos(_copy).profissional_id` |
| `usuario` | varchar | Login do usuário (username, não é e-mail) |
| `senha` | varchar | Hash bcrypt da senha — **nunca** deve ser selecionada fora de `auth.service.ts` |
| `nome` | varchar | Nome de exibição, retornado no login e usado como nome do profissional na Agenda |
| `numero_whatsapp` | varchar | Não usado por nenhum service do backend ainda |
| `empresa_id` | uuid (FK → `empresas.id`) | Vincula o usuário a uma empresa (multi-tenant) |
| `ativo` | boolean | Apenas usuários com `ativo = TRUE` podem logar, disparar fluxos de recuperação de senha, ou aparecer na lista de profissionais |
| `created_at` / `updated_at` | timestamptz | |

### `recuperacao_senha`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid (PK) | Usado para marcar o registro como utilizado |
| `usuario_id` | uuid (FK → `usuarios.id`) | |
| `codigo` | varchar | Código de verificação (6 dígitos numéricos, esperado pelo frontend) |
| `utilizado` | boolean | Marcado `TRUE` após uso bem-sucedido em `verifyCode` |
| `expiracao` | timestamp | Comparado com `NOW()` para validar se o código ainda é válido |
| `created_at` | timestamp | Usado para ordenar e pegar o código mais recente (`ORDER BY created_at DESC LIMIT 1`) |

### `empresas` (live) / `empresas_copy`

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | uuid (PK, `gen_random_uuid()`) | não | |
| `nome` | varchar | não | |
| `ativo` | boolean | sim (default `true`) | |
| `created_at` | timestamptz | sim (default `now()`) | |
| `updated_at` | timestamptz | sim (default `now()`) | |

Nenhum service do backend consulta `empresas`/`empresas_copy` ainda (só a coluna `empresa_id`, como FK solta, é referenciada em `clientes`/`usuarios`).

### `clientes` (live, só o bot do n8n escreve) / `clientes_copy` (a que o backend usa)

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | uuid (PK, `gen_random_uuid()`) | não | |
| `nome` | varchar | não | |
| `numero` | varchar | não | Telefone/WhatsApp do cliente (ex.: `553599712596`) |
| `empresa_id` | uuid (FK → `empresas.id`) | sim | |
| `cpf_cnpj` | varchar | sim | **Só existe em `clientes_copy`** — adicionada em 2026-08-27 |
| `email` | varchar | sim | **Só existe em `clientes_copy`** — adicionada em 2026-08-27 |
| `endereco_id` | uuid (FK → `enderecos.id`) | sim | **Só existe em `clientes_copy`** — adicionada em 2026-08-27 |

### `chats` (live) / `chats_copy` (a que o backend usa)

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | uuid (PK, `gen_random_uuid()`) | não | |
| `numero` | varchar | não | JID do WhatsApp (ex.: `553599712596@s.whatsapp.net`) |
| `etapa` | varchar | sim | Estágio interno do fluxo do bot n8n — **texto livre, sem enum/CHECK constraint**; único valor visto até agora nos dados: `selecao_opcao` |
| `data_ultima_conversa` | timestamptz | sim (default `now()`) | |
| `ultima_mensagem` | text | sim | |
| `cliente_id` | uuid (FK → `clientes.id`, `ON DELETE CASCADE` na tabela live) | sim | |
| `empresa_id` | uuid (FK → `empresas.id`, `ON DELETE CASCADE` na tabela live) | sim | |

### `agendamentos` (live) / `agendamentos_copy` (a que o backend usa)

Diferente de `clientes_copy`/`chats_copy`, esta tabela `_copy` **já existia no banco antes de qualquer trabalho deste projeto em 2026-08-29** — foi criada por fora, já seguindo a convenção. Ambas as tabelas (live e `_copy`) estavam **vazias (0 linhas)** quando encontradas.

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | uuid (PK, `gen_random_uuid()`) | não | |
| `cliente_id` | uuid (FK → `clientes.id`, `ON DELETE CASCADE` na tabela live) | sim | |
| `profissional_id` | uuid (FK → `usuarios.id`, `ON DELETE CASCADE` na tabela live) | sim | Um profissional é um `usuarios` com `ativo = TRUE` — não existe tabela `profissionais` |
| `empresa_id` | uuid (FK → `empresas.id`, `ON DELETE CASCADE` na tabela live) | sim | Não usado pelo backend ainda (sem escopo por empresa) |
| `data` | date | sim | |
| `hora_inicio` | time without time zone | sim | |
| `hora_fim` | time without time zone | sim | |
| `etapa` | varchar | sim | Texto livre, sem enum/CHECK constraint — não usado pelo frontend hoje |
| `data_criacao` | timestamptz (default `CURRENT_TIMESTAMP`) | sim | |
| `servico_id` | uuid (FK → `servicos.id`, `ON DELETE CASCADE` na tabela live) | sim | Não lido/gravado pelo backend — o campo Serviço foi removido do formulário em 2026-07-30 |
| `pago` | boolean (default `false`) | não | Não lido/gravado pelo backend ainda |
| `observacoes` | text | sim | **Só existe em `agendamentos_copy`** — adicionada em 2026-08-29 |
| `recorrencia` | varchar | sim | **Só existe em `agendamentos_copy`** — adicionada em 2026-08-29 |

`agendamentos_copy`, por ter sido criada via `LIKE agendamentos INCLUDING ALL` (mesmo padrão das outras `_copy`), **não tem nenhuma foreign key** — `cliente_id`/`profissional_id`/`servico_id`/`empresa_id` são só `uuid` soltos, sem constraint. O backend assume por convenção que `cliente_id` aponta para `clientes_copy.id` (não para a `clientes` live) e faz o `JOIN` de leitura de acordo.

### `enderecos` (novo em 2026-08-27, sem equivalente live)

| Coluna | Tipo | Nullable | Observações |
|---|---|---|---|
| `id` | uuid (PK, `gen_random_uuid()`) | não | |
| `cep` | varchar | sim | |
| `rua` | varchar | sim | |
| `numero` | varchar | sim | Número do endereço — não confundir com `clientes.numero` (telefone) |
| `complemento` | varchar | sim | |
| `bairro` | varchar | sim | |
| `cidade` | varchar | sim | |
| `estado` | varchar | sim | |

Referenciada por `clientes_copy.endereco_id`. Criada e populada pelo `POST /clientes` do backend (ver [backend.md](./backend.md)).

## Relacionamentos

```
empresas (live/_copy)  1 ──── N  clientes (live/_copy)
empresas (live/_copy)  1 ──── N  usuarios
usuarios                1 ──── N  recuperacao_senha
usuarios                1 ──── N  agendamentos (live/_copy)   (profissional_id)
clientes (live/_copy)  1 ──── N  chats (live/_copy)
clientes (live/_copy)  1 ──── N  agendamentos (live/_copy)
clientes_copy           1 ──── 1  enderecos   (via clientes_copy.endereco_id)
```

Na tabela `agendamentos_copy` especificamente, as FKs acima não são impostas pelo banco (nenhuma constraint) — são convenções que o backend segue ao gravar/ler.

## Pendências

- **Identificar por que `chats_copy`/`empresas_copy`/`clientes_copy` (desde 2026-08-27) e agora também `agendamentos_copy` (desde 2026-08-29) têm apresentado contagem de linhas instável** — não foi o backend deste projeto (auditado, sem `DELETE`/`TRUNCATE` sem filtro). Usuário vai investigar antes de recriar os dados.
- Confirmar tipos de dados exatos de colunas não usadas ainda (`servicos`, `cargos`, `permissoes`, `frases`, `instancia_por_empresa`) — não foram auditadas nesta rodada.
- Confirmar política de retenção/limpeza da tabela `recuperacao_senha` (hoje os registros usados/expirados nunca são removidos).
- Nenhuma migration/versionamento de schema — as mudanças de 2026-08-27 (`enderecos`, colunas em `clientes_copy`) e de 2026-08-29 (`observacoes`/`recorrencia` em `agendamentos_copy`) foram aplicadas via script Node ad-hoc, não commitado no repositório. Recomenda-se criar uma pasta `migrations/` assim que o schema estabilizar.
- Definir se/quando `chats_copy`, `clientes_copy` e `agendamentos_copy` deveriam ser resincronizadas com as tabelas live (hoje são um snapshot congelado do momento em que foram criadas — não recebem as novas conversas/clientes/agendamentos reais que o bot cria depois disso).
- Decidir se `agendamentos_copy.servico_id`/`pago` deveriam voltar a ser usados pelo frontend agora que há dados reais por trás — hoje ficam gravados como `null`/`false` sempre, já que o formulário não tem campos para eles.
