import { Router } from "express";
import * as clientesController from "./clientes.controller";

const router = Router();

router.get(
	"/",
	clientesController.listar
);

router.post(
	"/",
	clientesController.criar
);

router.delete(
	"/:id",
	clientesController.remover
);

export default router;
