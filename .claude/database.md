# Banco de Dados

## Sistema

- **SGBD**: PostgreSQL
- **Driver**: `pg` (node-postgres), sem ORM — todas as queries são SQL puro com parâmetros posicionais (`$1`, `$2`, ...).
- **Conexão**: pool único (`src/config/database.ts`), configurado via variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- **Não há migrations, seeds ou arquivo de schema (`.sql`) neste repositório.** Todo o schema abaixo foi inferido a partir das queries SQL escritas em `aura-meu-negocio-backend/aura-meu-negocio-backend/src/modules/auth/auth.service.ts`.

## Tabelas inferidas

### `usuarios`

| Coluna | Tipo inferido | Observações |
|---|---|---|
| `id` | integer (PK) | Usado no payload do JWT e como FK em `recuperacao_senha.usuario_id` |
| `usuario` | text/varchar | Login do usuário (username, não é e-mail) — usado em `WHERE usuario = $1` |
| `senha` | text | Hash bcrypt da senha |
| `nome` | text | Nome de exibição, retornado no login |
| `empresa_id` | integer (FK) | Vincula o usuário a uma empresa — sugere modelo multi-tenant, mas não há tabela `empresas` visível no código atual |
| `ativo` | boolean | Apenas usuários com `ativo = TRUE` podem logar ou disparar fluxos de recuperação de senha |

### `recuperacao_senha`

| Coluna | Tipo inferido | Observações |
|---|---|---|
| `id` | integer (PK) | Usado para marcar o registro como utilizado |
| `usuario_id` | integer (FK → `usuarios.id`) | |
| `codigo` | text/varchar | Código de verificação (formato esperado pelo frontend: 6 dígitos numéricos) |
| `utilizado` | boolean | Marcado `TRUE` após uso bem-sucedido em `verifyCode` |
| `expiracao` | timestamp | Comparado com `NOW()` para validar se o código ainda é válido |
| `created_at` | timestamp | Usado para ordenar e pegar o código mais recente (`ORDER BY created_at DESC LIMIT 1`) |

## Relacionamentos

```
empresas (não confirmada) 1 ──── N usuarios
usuarios            1 ──── N recuperacao_senha
```

## Observações relevantes

- O nome do banco configurado em `.env` é `DB_NAME=n8n`, hospedado em `easypanel.aura-ia.cloud`. Isso sugere que o schema da aplicação pode estar coexistindo no mesmo banco usado pela instância n8n (responsável por enviar os códigos via WhatsApp), em vez de um banco dedicado à aplicação. Ver Pendências.
- Não há nenhuma query no código atual que **insira** um registro em `recuperacao_senha` — a função `sendResetCode` apenas dispara um webhook para o n8n. É provável que o próprio workflow do n8n seja responsável por gerar o código e inserir a linha nesta tabela diretamente no banco.

## Pendências

- Não existe nenhum arquivo de schema/migration versionado no repositório — recomenda-se criar (ex.: pasta `migrations/` ou schema Prisma/Drizzle, mesmo mantendo queries manuais) para que o schema do banco passe a ser rastreável via Git.
- Confirmar a existência e estrutura de uma tabela `empresas` (referenciada por `usuarios.empresa_id`, mas nunca consultada em nenhum service deste backend).
- Confirmar tipos de dados exatos de cada coluna (os tipos acima são inferências baseadas no uso, não em um `\d` real do banco).
- Confirmar se o banco é compartilhado com o n8n ou se é um banco/schema isolado.
- Confirmar se existem outras tabelas já criadas no banco para os módulos de negócio (atendimentos, agendamentos, clientes, etc.) que ainda não têm código de acesso no backend.
- Confirmar política de retenção/limpeza da tabela `recuperacao_senha` (hoje os registros usados/expirados nunca são removidos).
