import { Request, Response } from "express";
import * as clientesService from "./clientes.service";

export async function listar(
	req: Request,
	res: Response
) {
	try {
		const clientes = await clientesService.listar();

		return res.json(clientes);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao buscar clientes",
		});
	}
}

export async function criar(
	req: Request,
	res: Response
) {
	try {
		const { nome, numero, cpfCnpj, email, endereco } = req.body;

		if (!nome || !numero) {
			return res.status(400).json({
				message: "Nome e telefone são obrigatórios.",
			});
		}

		const cliente = await clientesService.criar({
			nome,
			numero,
			cpfCnpj,
			email,
			endereco,
		});

		return res.status(201).json(cliente);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao criar cliente",
		});
	}
}

export async function remover(
	req: Request,
	res: Response
) {
	try {
		const id = String(req.params.id);
		await clientesService.remover(id);

		return res.status(204).send();
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao excluir cliente",
		});
	}
}
