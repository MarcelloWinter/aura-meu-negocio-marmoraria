import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { api } from "../../services/api";

export function ResetPassword() {
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errors, setErrors] =
    useState({
      novaSenha: "",
      confirmarSenha: "",
      geral: "",
    });

  useEffect(() => {
    const codeValidated =
      localStorage.getItem(
        "@aura:code-validated"
      );

    if (!codeValidated) {
      navigate("/");
    }
  }, [navigate]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const usuario =
      localStorage.getItem(
        "@aura:reset-user"
      );

    const novosErros = {
      novaSenha: "",
      confirmarSenha: "",
      geral: "",
    };

    if (!novaSenha.trim()) {
      novosErros.novaSenha =
        "Informe a nova senha.";
    }

    if (!confirmarSenha.trim()) {
      novosErros.confirmarSenha =
        "Confirme a nova senha.";
    }

    if (
      novaSenha &&
      confirmarSenha &&
      novaSenha !== confirmarSenha
    ) {
      novosErros.confirmarSenha =
        "As senhas não coincidem.";
    }

    if (
      novosErros.novaSenha ||
      novosErros.confirmarSenha
    ) {
      setErrors(novosErros);
      return;
    }

    if (!usuario) {
      setErrors({
        novaSenha: "",
        confirmarSenha: "",
        geral:
          "Sessão de recuperação inválida. Tente novamente.",
      });

      return;
    }

    try {
      setLoading(true);

      setErrors({
        novaSenha: "",
        confirmarSenha: "",
        geral: "",
      });

      await api.post(
        "/auth/reset-password",
        {
          usuario,
          novaSenha,
        }
      );

      localStorage.removeItem(
        "@aura:reset-user"
      );

      localStorage.removeItem(
        "@aura:code-validated"
      );

      localStorage.removeItem(
        "@aura:reset-user-id"
      );

      setSuccessMessage(
        "Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em instantes."
      );

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      setErrors({
        novaSenha: "",
        confirmarSenha: "",
        geral:
          error?.response?.data?.message ||
          "Não foi possível alterar a senha.",
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
              Criar Nova Senha
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Defina sua nova senha de acesso.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              label="Nova senha"
              type="password"
              placeholder="Digite sua nova senha"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(
                  e.target.value
                );

                if (
                  errors.novaSenha ||
                  errors.geral
                ) {
                  setErrors((prev) => ({
                    ...prev,
                    novaSenha: "",
                    geral: "",
                  }));
                }
              }}
              error={errors.novaSenha}
            />

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Confirme sua nova senha"
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(
                  e.target.value
                );

                if (
                  errors.confirmarSenha ||
                  errors.geral
                ) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmarSenha: "",
                    geral: "",
                  }));
                }
              }}
              error={
                errors.confirmarSenha
              }
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
                <div className="font-semibold">
                  ✓ Senha alterada com sucesso
                </div>

                <div className="mt-1">
                  {successMessage}
                </div>
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

            <Button
              type="submit"
              disabled={
                loading ||
                !!successMessage
              }
            >
              {loading
                ? "Alterando senha..."
                : "Confirmar Nova Senha"}
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