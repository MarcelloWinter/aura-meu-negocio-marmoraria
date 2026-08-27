import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import clientesRoutes from "./modules/clientes/clientes.routes";
import chatsRoutes from "./modules/chats/chats.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clientes", clientesRoutes);
app.use("/chats", chatsRoutes);

export { app };