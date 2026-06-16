import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function login(
    req: Request,
    res: Response
) {
    try {
        const { usuario, senha } = req.body;

        const result =
            await authService.login(
                usuario,
                senha
            );

        return res.json(result);
    } catch (error) {
        return res.status(401).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao autenticar",
        });
    }
}

export async function forgotPassword(
    req: Request,
    res: Response
) {
    try {
        const { usuario } = req.body;

        const result =
            await authService.forgotPassword(
                usuario
            );

        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao recuperar senha",
        });
    }
}

export async function sendResetCode(
    req: Request,
    res: Response
) {
    try {
        const { usuario } = req.body;

        const result =
            await authService.sendResetCode(
                usuario
            );

        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao enviar código",
        });
    }
}

export async function verifyCode(
    req: Request,
    res: Response
) {
    try {
        const {
            usuario,
            codigo,
        } = req.body;

        const result =
            await authService.verifyCode(
                usuario,
                codigo
            );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Código inválido.",
        });
    }
}

export async function resetPassword(
    req: Request,
    res: Response
) {
    try {
        const {
            usuario,
            novaSenha,
        } = req.body;

        const result =
            await authService.resetPassword(
                usuario,
                novaSenha
            );

        return res.json(result);
    } catch (error) {
        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao alterar senha",
        });
    }
}