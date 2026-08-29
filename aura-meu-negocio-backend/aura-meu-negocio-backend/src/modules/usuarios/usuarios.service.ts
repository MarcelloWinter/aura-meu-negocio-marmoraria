import { pool } from "../../config/database";

export async function listar() {
	const result = await pool.query(`
		SELECT id, nome
		FROM usuarios
		WHERE ativo = TRUE
		ORDER BY nome
	`);

	return result.rows;
}
