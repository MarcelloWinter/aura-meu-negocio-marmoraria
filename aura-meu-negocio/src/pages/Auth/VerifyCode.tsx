import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { AuthLayout } from "../../components/AuthLayout";
import { AuthCard } from "../../components/AuthCard";
import { api, getApiErrorMessage } from "../../services/api";

export function VerifyCode() {
	const navigate = useNavigate();

	const [codigo, setCodigo] = useState("");
	const [loading, setLoading] = useState(false);

	const [errors, setErrors] = useState({
		codigo: "",
		geral: "",
	});

	const [successMessage, setSuccessMessage] = useState("");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const usuario = localStorage.getItem("@aura:reset-user");

		const novosErros = {
			codigo: "",
			geral: "",
		};

		if (!codigo.trim()) {
			novosErros.codigo = "Informe o código.";
		}

		if (novosErros.codigo) {
			setErrors(novosErros);
			return;
		}

		if (!usuario) {
			setErrors({
				codigo: "",
				geral: "Sessão de recuperação inválida. Tente novamente.",
			});

			return;
		}

		try {
			setLoading(true);

			setErrors({
				codigo: "",
				geral: "",
			});

			setSuccessMessage("");

			await api.post("/auth/verify-code", {
				usuario,
				codigo,
			});

			localStorage.setItem("@aura:code-validated", "true");

			navigate("/resetar-senha");
		} catch (error) {
			setErrors({
				codigo: "",
				geral: getApiErrorMessage(error, "Código inválido ou expirado."),
			});
		} finally {
			setLoading(false);
		}
	}

	async function handleResendCode() {
		const usuario = localStorage.getItem("@aura:reset-user");

		if (!usuario) {
			setErrors({
				codigo: "",
				geral: "Sessão de recuperação inválida. Tente novamente.",
			});

			return;
		}

		try {
			setLoading(true);

			await api.post("/auth/send-reset-code", {
				usuario,
			});

			setErrors({
				codigo: "",
				geral: "",
			});

			setSuccessMessage(
				"Enviamos um novo código de verificação para o WhatsApp cadastrado."
			);
		} catch (error) {
			setErrors({
				codigo: "",
				geral: getApiErrorMessage(error, "Não foi possível reenviar o código."),
			});

			setSuccessMessage("");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<AuthCard
				title="Código de Verificação"
				description="Digite o código de 6 dígitos enviado para seu WhatsApp."
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Código"
						placeholder="000000"
						maxLength={6}
						value={codigo}
						onChange={(e) => {
							setCodigo(e.target.value.replace(/\D/g, ""));

							if (errors.codigo || errors.geral) {
								setErrors({
									codigo: "",
									geral: "",
								});
							}
						}}
						error={errors.codigo}
					/>

					{successMessage && (
						<div
							className="
								rounded-xl
								border
								border-green-200
								bg-green-50
								p-4
								text-sm
								text-green-700
							"
						>
							<div className="font-semibold">✓ Código reenviado</div>

							<div className="mt-1">{successMessage}</div>
						</div>
					)}

					{errors.geral && (
						<div
							className="
								rounded-xl
								border
								border-red-200
								bg-red-50
								p-3
								text-sm
								text-red-600
							"
						>
							{errors.geral}
						</div>
					)}

					<Button type="submit" disabled={loading}>
						{loading ? "Validando..." : "Confirmar Código"}
					</Button>

					<Button
						type="button"
						variant="ghost"
						disabled={loading}
						onClick={handleResendCode}
					>
						Reenviar Código
					</Button>
				</form>
			</AuthCard>
		</AuthLayout>
	);
}
