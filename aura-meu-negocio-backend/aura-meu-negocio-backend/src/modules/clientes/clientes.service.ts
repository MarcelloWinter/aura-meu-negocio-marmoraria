import { pool } from "../../config/database";

type EnderecoInput = {
	cep?: string;
	rua?: string;
	numero?: string;
	complemento?: string;
	bairro?: string;
	cidade?: string;
	estado?: string;
};

type ClienteInput = {
	nome: string;
	numero: string;
	cpfCnpj?: string;
	email?: string;
	endereco?: EnderecoInput;
};

export async function listar() {
	const result = await pool.query(`
		SELECT
			clientes_copy.id,
			clientes_copy.nome,
			clientes_copy.numero,
			clientes_copy.empresa_id,
			clientes_copy.cpf_cnpj,
			clientes_copy.email,
			enderecos.cep AS endereco_cep,
			enderecos.rua AS endereco_rua,
			enderecos.numero AS endereco_numero,
			enderecos.complemento AS endereco_complemento,
			enderecos.bairro AS endereco_bairro,
			enderecos.cidade AS endereco_cidade,
			enderecos.estado AS endereco_estado
		FROM clientes_copy
		LEFT JOIN enderecos ON enderecos.id = clientes_copy.endereco_id
		ORDER BY clientes_copy.nome
	`);

	return result.rows;
}

export async function criar(dados: ClienteInput) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		let enderecoId: string | null = null;

		if (dados.endereco && Object.values(dados.endereco).some((valor) => valor)) {
			const enderecoResult = await client.query(
				`
				INSERT INTO enderecos (cep, rua, numero, complemento, bairro, cidade, estado)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
				`,
				[
					dados.endereco.cep ?? null,
					dados.endereco.rua ?? null,
					dados.endereco.numero ?? null,
					dados.endereco.complemento ?? null,
					dados.endereco.bairro ?? null,
					dados.endereco.cidade ?? null,
					dados.endereco.estado ?? null,
				]
			);
			enderecoId = enderecoResult.rows[0].id;
		}

		const clienteResult = await client.query(
			`
			INSERT INTO clientes_copy (nome, numero, cpf_cnpj, email, endereco_id)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, nome, numero, empresa_id, cpf_cnpj, email, endereco_id
			`,
			[
				dados.nome,
				dados.numero,
				dados.cpfCnpj ?? null,
				dados.email ?? null,
				enderecoId,
			]
		);

		await client.query("COMMIT");

		return {
			...clienteResult.rows[0],
			endereco_cep: dados.endereco?.cep ?? null,
			endereco_rua: dados.endereco?.rua ?? null,
			endereco_numero: dados.endereco?.numero ?? null,
			endereco_complemento: dados.endereco?.complemento ?? null,
			endereco_bairro: dados.endereco?.bairro ?? null,
			endereco_cidade: dados.endereco?.cidade ?? null,
			endereco_estado: dados.endereco?.estado ?? null,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export async function remover(id: string) {
	await pool.query(`DELETE FROM clientes_copy WHERE id = $1`, [id]);
}
