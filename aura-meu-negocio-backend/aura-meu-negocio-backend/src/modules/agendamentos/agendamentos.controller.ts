import { Request, Response } from "express";
import * as agendamentosService from "./agendamentos.service";

export async function listar(
	req: Request,
	res: Response
) {
	try {
		const agendamentos = await agendamentosService.listar();

		return res.json(agendamentos);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao buscar agendamentos",
		});
	}
}

export async function criar(
	req: Request,
	res: Response
) {
	try {
		const {
			clienteId,
			profissionalId,
			data,
			horaInicio,
			horaFim,
			observacoes,
			recorrencia,
		} = req.body;

		if (!clienteId || !profissionalId || !data || !horaInicio || !horaFim) {
			return res.status(400).json({
				message: "Cliente, profissional, data e horário são obrigatórios.",
			});
		}

		const agendamento = await agendamentosService.criar({
			clienteId,
			profissionalId,
			data,
			horaInicio,
			horaFim,
			observacoes,
			recorrencia,
		});

		return res.status(201).json(agendamento);
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao criar agendamento",
		});
	}
}

export async function remover(
	req: Request,
	res: Response
) {
	try {
		const id = String(req.params.id);
		await agendamentosService.remover(id);

		return res.status(204).send();
	} catch (error) {
		return res.status(500).json({
			message:
				error instanceof Error
					? error.message
					: "Erro ao excluir agendamento",
		});
	}
}
