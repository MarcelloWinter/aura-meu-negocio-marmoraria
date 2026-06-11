import axios from "axios";
import { pool } from "../../config/database";
import { comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import bcrypt from "bcrypt";

export async function login(
  usuario: string,
  senha: string
) {
  const result = await pool.query(
    `
    SELECT *
    FROM usuarios
    WHERE usuario = $1
    AND ativo = TRUE
    `,
    [usuario]
  );

  if (result.rowCount === 0) {
    throw new Error("Usuário ou senha inválidos");
  }

  const user = result.rows[0];

  const passwordMatch =
    await comparePassword(
      senha,
      user.senha
    );

  if (!passwordMatch) {
    throw new Error("Usuário ou senha inválidos");
  }

  const token = generateToken({
    id: user.id,
    empresaId: user.empresa_id,
  });

  return {
    token,
    usuario: {
      id: user.id,
      nome: user.nome,
      empresaId: user.empresa_id
    },
  };
}

export async function forgotPassword(
  usuario: string
) {
  const result = await pool.query(
    `
    SELECT id
    FROM usuarios
    WHERE usuario = $1
    AND ativo = TRUE
    `,
    [usuario]
  );

  if (result.rowCount === 0) {
    throw new Error(
      "Usuário não encontrado."
    );
  }

  return {
    success: true,
  };
}

export async function sendResetCode(
  usuario: string
) {
  const result = await pool.query(
    `
    SELECT
      id,
      usuario,
      ativo
    FROM usuarios
    WHERE usuario = $1
      AND ativo = TRUE
    `,
    [usuario]
  );

  if (result.rowCount === 0) {
    throw new Error(
      "Usuário não encontrado."
    );
  }

  const webhookResponse =
    await axios.post(
      "https://n8n.aura-ia.cloud/webhook/enviar-codigo",
      {
        usuario,
      }
    );

  if (
    !webhookResponse.data?.success
  ) {
    throw new Error(
      "Não foi possível enviar o código."
    );
  }

  return {
    success: true,
    message:
      "Código enviado com sucesso."
  };
}

export async function verifyCode(
  usuario: string,
  codigo: string
) {
  const userResult =
    await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE usuario = $1
        AND ativo = TRUE
      `,
      [usuario]
    );

  if (userResult.rowCount === 0) {
    throw new Error(
      "Usuário não encontrado."
    );
  }

  const usuarioId =
    userResult.rows[0].id;

  const codeResult =
    await pool.query(
      `
      SELECT id
      FROM recuperacao_senha
      WHERE usuario_id = $1
        AND codigo = $2
        AND utilizado = FALSE
        AND expiracao > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [
        usuarioId,
        codigo,
      ]
    );

  if (codeResult.rowCount === 0) {
    throw new Error(
      "Código inválido ou expirado."
    );
  }

  // Marca o código como utilizado
  await pool.query(
    `
    UPDATE recuperacao_senha
    SET utilizado = TRUE
    WHERE id = $1
    `,
    [codeResult.rows[0].id]
  );

  return {
    success: true,
  };
}

export async function resetPassword(
  usuario: string,
  novaSenha: string
) {
  const userResult =
    await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE usuario = $1
        AND ativo = TRUE
      `,
      [usuario]
    );

  if (userResult.rowCount === 0) {
    throw new Error(
      "Usuário não encontrado."
    );
  }

  const senhaHash =
    await bcrypt.hash(
      novaSenha,
      10
    );

  await pool.query(
    `
    UPDATE usuarios
    SET senha = $1
    WHERE usuario = $2
    `,
    [
      senhaHash,
      usuario,
    ]
  );

  return {
    success: true,
  };
}