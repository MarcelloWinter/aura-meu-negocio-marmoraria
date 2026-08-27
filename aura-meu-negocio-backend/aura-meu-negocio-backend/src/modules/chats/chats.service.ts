import { pool } from "../../config/database";

export async function listar() {
	const result = await pool.query(`
		SELECT
			chats_copy.id,
			chats_copy.numero,
			chats_copy.etapa,
			chats_copy.data_ultima_conversa,
			chats_copy.ultima_mensagem,
			chats_copy.cliente_id,
			clientes_copy.nome AS cliente_nome
		FROM chats_copy
		LEFT JOIN clientes_copy ON clientes_copy.id = chats_copy.cliente_id
		ORDER BY chats_copy.data_ultima_conversa DESC NULLS LAST
	`);

	return result.rows;
}
