import dotenv from "dotenv";

dotenv.config();

import { app } from "./app";
import { pool } from "./config/database";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT NOW()");

    console.log("Banco conectado");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

start();