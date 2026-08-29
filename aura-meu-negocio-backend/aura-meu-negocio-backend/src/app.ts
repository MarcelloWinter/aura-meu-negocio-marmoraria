import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import clientesRoutes from "./modules/clientes/clientes.routes";
import chatsRoutes from "./modules/chats/chats.routes";
import agendamentosRoutes from "./modules/agendamentos/agendamentos.routes";
import usuariosRoutes from "./modules/usuarios/usuarios.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/chats", chatsRoutes);
app.use("/agendamentos", agendamentosRoutes);
app.use("/usuarios", usuariosRoutes);

export { app };