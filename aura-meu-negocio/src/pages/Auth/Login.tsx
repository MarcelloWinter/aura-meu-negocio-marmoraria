import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
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

      navigate("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">
            A
          </div>

          <h1 className="text-3xl font-bold text-[var(--text)]">
            Aura{" "}
            <span className="font-normal text-[var(--text-secondary)]">
              Meu Negócio
            </span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[var(--card)] rounded-3xl shadow-lg border border-[var(--border)] p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--text)]">
              Bem-vindo
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Entre para acessar sua conta.
            </p>
          </div>

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
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          © {new Date().getFullYear()} Aura
          Soluções Tecnológicas
        </p>
      </div>
    </div>
  );
}