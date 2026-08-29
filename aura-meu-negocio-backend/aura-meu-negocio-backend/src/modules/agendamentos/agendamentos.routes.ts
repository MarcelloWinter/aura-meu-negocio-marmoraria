import { Router } from "express";
import * as agendamentosController from "./agendamentos.controller";

const router = Router();

router.get(
	"/",
	agendamentosController.listar
);

router.post(
	"/",
	agendamentosController.criar
);

router.delete(
	"/:id",
	agendamentosController.remover
);

export default router;
