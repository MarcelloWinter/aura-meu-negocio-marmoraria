import { Request, Response } from "express";
import * as chatsService from "./chats.service";

export async function listar(
	req: Request,
	res: Response
) {
	try {
		const chats = await chatsService.listar();

		return res.json(chats);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao buscar chats",
		});
	}
}
