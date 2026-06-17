import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { AuthCard } from "../../components/AuthCard";
import { AuthLayout } from "../../components/AuthLayout";
import { api } from "../../services/api";

export function Login() {
	const navigate = useNavigate();

	const [usuario, setUsuario] = useState("");
	const [senha, setSenha] = useState("");
	const [loading, setLoading] = useState(false);

	const [errors, setErrors] = useState({
		usuario: "",
		senha: "",
		geral: "",
	});

	async function handleLogin(
		e: React.FormEvent<HTMLFormElement>
	) {
		e.preventDefault();

		const novosErros = {
			usuario: "",
			senha: "",
			geral: "",
		};

		if (!usuario.trim()) {
			novosErros.usuario = "Informe o usuário.";
		}

		if (!senha.trim()) {
			novosErros.senha = "Informe a senha.";
		}

		if (
			novosErros.usuario ||
			novosErros.senha
		) {
			setErrors(novosErros);
			return;
		}

		try {
			setLoading(true);

			setErrors({
				usuario: "",
				senha: "",
				geral: "",
			});

			const response = await api.post(
				"/auth/login",
				{
					usuario,
					senha,
				}
			);

			const { token, usuario: usuarioLogado } =
				response.data;

			localStorage.setItem(
				"@aura:token",
				token
			);

			localStorage.setItem(
				"@aura:user",
				JSON.stringify(usuarioLogado)
			);

			navigate("/atendimento");
		} catch (error: any) {
			setErrors({
				usuario: "",
				senha: "",
				geral:
					error?.response?.data?.message ||
					"Usuário ou senha inválidos.",
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<AuthCard
				title="Bem-vindo"
				description="Entre para acessar sua conta."
			>
				<form
					onSubmit={handleLogin}
					className="space-y-4"
				>
					<Input
						label="Usuário"
						placeholder="Digite seu usuário"
						value={usuario}
						onChange={(e) => {
							setUsuario(e.target.value);

							if (errors.usuario) {
								setErrors((prev) => ({
									...prev,
									usuario: "",
								}));
							}
						}}
						error={errors.usuario}
					/>

					<Input
						label="Senha"
						type="password"
						placeholder="Digite sua senha"
						value={senha}
						onChange={(e) => {
							setSenha(e.target.value);

							if (errors.senha) {
								setErrors((prev) => ({
									...prev,
									senha: "",
								}));
							}
						}}
						error={errors.senha}
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

					<Button
						type="submit"
						disabled={loading}
					>
						{loading
							? "Entrando..."
							: "Entrar"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<Link
						to="/recuperar-senha"
						className="text-[var(--primary)] hover:underline text-sm"
					>
						Esqueci minha senha
					</Link>
				</div>
			</AuthCard>
		</AuthLayout>
	);
}