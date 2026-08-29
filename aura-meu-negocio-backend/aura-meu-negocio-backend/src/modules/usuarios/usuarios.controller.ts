import { Request, Response } from "express";
import * as usuariosService from "./usuarios.service";

export async function listar(
	req: Request,
	res: Response
) {
	try {
		const usuarios = await usuariosService.listar();

		return res.json(usuarios);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao buscar usuários",
		});
	}
}
