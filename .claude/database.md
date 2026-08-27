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

Por causa do parágrafo acima, `clientes`, `chats` e `empresas` foram duplicadas (estrutura + dados, via `CREATE TABLE "<nome>_copy" (LIKE "<nome>" INCLUDING ALL)`) em `clientes_copy`, `chats_copy` e `empresas_copy`. **O backend deste app (`aura-meu-negocio-backend`) só pode ler e escrever nessas três tabelas `_copy` — nunca nas tabelas live.** `LIKE ... INCLUDING ALL` não copia foreign keys, então as tabelas `_copy` são estruturalmente independentes das tabelas live (nenhuma FK cruza as duas).

Essa regra está registrada como memória de projeto (fora do repositório, para persistir entre sessões) e deve ser respeitada em qualquer novo código, migração ou script que toque neste banco. A tabela `enderecos` (nova, criada em 2026-08-27, sem equivalente live) é a única exceção que não precisa de sufixo `_copy` — não existe uma tabela `enderecos` live para colidir.

**Achado não resolvido (2026-08-27)**: em algum momento desta sessão de trabalho, `chats_copy` e `empresas_copy` foram esvaziadas (0 linhas — antes tinham 2 cada) e `clientes_copy` ficou reduzida a 1 linha de teste (antes tinha 3). Não foi identificada nenhuma query deste backend capaz de causar isso (o único `DELETE` existente sempre tem `WHERE id = $1`). Usuário vai investigar a causa antes de recriar os dados — ver Pendências.

## Tabelas de negócio confirmadas

### `usuarios`

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid (PK) | Usado no payload do JWT e como FK em `recuperacao_senha.usuario_id` |
| `usuario` | varchar | Login do usuário (username, não é e-mail) |
| `senha` | text | Hash bcrypt da senha |
| `nome` | varchar | Nome de exibição, retornado no login |
| `empresa_id` | uuid (FK → `empresas.id`) | Vincula o usuário a uma empresa (multi-tenant) |
| `ativo` | boolean | Apenas usuários com `ativo = TRUE` podem logar ou disparar fluxos de recuperação de senha |

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
clientes (live/_copy)  1 ──── N  chats (live/_copy)
clientes_copy           1 ──── 1  enderecos   (via clientes_copy.endereco_id)
```

## Pendências

- **Identificar por que `chats_copy`/`empresas_copy` foram esvaziadas e `clientes_copy` perdeu 2 dos 3 registros originais em 2026-08-27** — não foi o backend deste projeto (auditado, sem `DELETE`/`TRUNCATE` sem filtro). Usuário vai investigar antes de recriar os dados.
- Confirmar tipos de dados exatos de colunas não usadas ainda (`agendamentos`, `servicos`, `cargos`, `permissoes`, `frases`, `instancia_por_empresa`) — não foram auditadas nesta rodada.
- Confirmar política de retenção/limpeza da tabela `recuperacao_senha` (hoje os registros usados/expirados nunca são removidos).
- Nenhuma migration/versionamento de schema — as mudanças de 2026-08-27 (`enderecos`, colunas em `clientes_copy`) foram aplicadas via script Node ad-hoc, não commitado no repositório. Recomenda-se criar uma pasta `migrations/` assim que o schema estabilizar.
- Definir se/quando `chats_copy` e `clientes_copy` deveriam ser resincronizadas com as tabelas live (hoje são um snapshot congelado do momento em que foram criadas — não recebem as novas conversas/clientes reais que o bot cria depois disso).
