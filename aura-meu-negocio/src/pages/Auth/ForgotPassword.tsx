import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { AuthCard } from "../../components/AuthCard";
import { AuthLayout } from "../../components/AuthLayout";
import { api, getApiErrorMessage } from "../../services/api";

export function ForgotPassword() {
	const navigate = useNavigate();

	const [usuario, setUsuario] = useState("");
	const [loading, setLoading] = useState(false);

	const [errors, setErrors] = useState({
		usuario: "",
		geral: "",
	});

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const novosErros = {
			usuario: "",
			geral: "",
		};

		if (!usuario.trim()) {
			novosErros.usuario = "Informe o usuário.";
		}

		if (novosErros.usuario) {
			setErrors(novosErros);
			return;
		}

		try {
			setLoading(true);

			setErrors({
				usuario: "",
				geral: "",
			});

			const response = await api.post("/auth/forgot-password", {
				usuario,
			});

			await api.post("/auth/send-reset-code", {
				usuario,
			});

			localStorage.setItem("@aura:reset-user", usuario);

			if (response.data.usuarioId) {
				localStorage.setItem("@aura:reset-user-id", response.data.usuarioId);
			}

			navigate("/verificar-codigo");
		} catch (error) {
			setErrors({
				usuario: "",
				geral: getApiErrorMessage(error, "Não foi possível enviar o código."),
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<AuthCard
				title="Recuperar Senha"
				description="Informe seu usuário para redefinir sua senha."
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Usuário"
						placeholder="Digite seu usuário"
						value={usuario}
						onChange={(e) => {
							setUsuario(e.target.value);

							if (errors.usuario || errors.geral) {
								setErrors({
									usuario: "",
									geral: "",
								});
							}
						}}
						error={errors.usuario}
					/>

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
						{loading ? "Enviando código..." : "Alterar Senha"}
					</Button>

					<Button type="button" onClick={() => navigate("/")} variant="ghost">
						Voltar
					</Button>
				</form>
			</AuthCard>
		</AuthLayout>
	);
}
