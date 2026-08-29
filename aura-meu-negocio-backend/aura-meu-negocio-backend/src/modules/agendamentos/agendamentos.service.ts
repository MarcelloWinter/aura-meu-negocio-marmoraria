import { pool } from "../../config/database";

type AgendamentoInput = {
	clienteId: string;
	profissionalId: string;
	data: string;
	horaInicio: string;
	horaFim: string;
	observacoes?: string;
	recorrencia?: string;
};

export async function listar() {
	const result = await pool.query(`
		SELECT
			agendamentos_copy.id,
			agendamentos_copy.cliente_id,
			clientes_copy.nome AS cliente_nome,
			agendamentos_copy.profissional_id,
			usuarios.nome AS profissional_nome,
			agendamentos_copy.data::text AS data,
			agendamentos_copy.hora_inicio,
			agendamentos_copy.hora_fim,
			agendamentos_copy.etapa,
			agendamentos_copy.pago,
			agendamentos_copy.observacoes,
			agendamentos_copy.recorrencia
		FROM agendamentos_copy
		LEFT JOIN clientes_copy ON clientes_copy.id = agendamentos_copy.cliente_id
		LEFT JOIN usuarios ON usuarios.id = agendamentos_copy.profissional_id
		ORDER BY agendamentos_copy.data, agendamentos_copy.hora_inicio
	`);

	return result.rows;
}

export async function criar(dados: AgendamentoInput) {
	const result = await pool.query(
		`
		INSERT INTO agendamentos_copy (cliente_id, profissional_id, data, hora_inicio, hora_fim, observacoes, recorrencia)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, cliente_id, profissional_id, data::text AS data, hora_inicio, hora_fim, etapa, pago, observacoes, recorrencia
		`,
		[
			dados.clienteId,
			dados.profissionalId,
			dados.data,
			dados.horaInicio,
			dados.horaFim,
			dados.observacoes ?? null,
			dados.recorrencia ?? "nenhuma",
		]
	);

	return result.rows[0];
}

export async function remover(id: string) {
	await pool.query(`DELETE FROM agendamentos_copy WHERE id = $1`, [id]);
}
