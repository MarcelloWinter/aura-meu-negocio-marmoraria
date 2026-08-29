import { Router } from "express";
import * as usuariosController from "./usuarios.controller";

const router = Router();

router.get(
	"/",
	usuariosController.listar
);

export default router;
