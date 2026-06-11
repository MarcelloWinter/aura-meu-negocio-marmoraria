import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { api } from "../../services/api";

export function ForgotPassword() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    usuario: "",
    geral: "",
  });

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const novosErros = {
      usuario: "",
      geral: "",
    };

    if (!usuario.trim()) {
      novosErros.usuario =
        "Informe o usuário.";
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

      // Verifica se o usuário existe
      const response = await api.post(
        "/auth/forgot-password",
        {
          usuario,
        }
      );

      // Envia o código de recuperação
      await api.post(
        "/auth/send-reset-code",
        {
          usuario,
        }
      );

      // Salva usuário para as próximas etapas
      localStorage.setItem(
        "@aura:reset-user",
        usuario
      );

      // Caso futuramente o backend retorne o ID
      if (response.data.usuarioId) {
        localStorage.setItem(
          "@aura:reset-user-id",
          response.data.usuarioId
        );
      }

      navigate("/verificar-codigo");
    } catch (error: any) {
      setErrors({
        usuario: "",
        geral:
          error?.response?.data?.message ||
          "Não foi possível enviar o código.",
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
              Recuperar Senha
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Informe seu usuário para redefinir sua senha.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              label="Usuário"
              placeholder="Digite seu usuário"
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);

                if (
                  errors.usuario ||
                  errors.geral
                ) {
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

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Enviando código..."
                : "Alterar Senha"}
            </Button>

            <Button
              type="button"
              onClick={() => navigate("/")}
              variant="ghost"
            >
              Voltar
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          © {new Date().getFullYear()} Aura Soluções Tecnológicas
        </p>
      </div>
    </div>
  );
}