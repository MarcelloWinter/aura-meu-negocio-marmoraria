import { Router } from "express";
import * as chatsController from "./chats.controller";

const router = Router();

router.get(
	"/",
	chatsController.listar
);

export default router;
