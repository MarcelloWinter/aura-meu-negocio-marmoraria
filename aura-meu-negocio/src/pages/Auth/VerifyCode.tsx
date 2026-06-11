import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { api } from "../../services/api";

export function VerifyCode() {
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    codigo: "",
    geral: "",
  });

  const [successMessage, setSuccessMessage] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const usuario = localStorage.getItem(
      "@aura:reset-user"
    );

    const novosErros = {
      codigo: "",
      geral: "",
    };

    if (!codigo.trim()) {
      novosErros.codigo =
        "Informe o código.";
    }

    if (novosErros.codigo) {
      setErrors(novosErros);
      return;
    }

    if (!usuario) {
      setErrors({
        codigo: "",
        geral:
          "Sessão de recuperação inválida. Tente novamente.",
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

      await api.post(
        "/auth/verify-code",
        {
          usuario,
          codigo,
        }
      );

      localStorage.setItem(
        "@aura:code-validated",
        "true"
      );

      navigate("/resetar-senha");
    } catch (error: any) {
      setErrors({
        codigo: "",
        geral:
          error?.response?.data?.message ||
          "Código inválido ou expirado.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    const usuario = localStorage.getItem(
      "@aura:reset-user"
    );

    if (!usuario) {
      setErrors({
        codigo: "",
        geral:
          "Sessão de recuperação inválida. Tente novamente.",
      });

      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/send-reset-code",
        {
          usuario,
        }
      );

      setErrors({
        codigo: "",
        geral: "",
      });

      setSuccessMessage(
        "Enviamos um novo código de verificação para o WhatsApp cadastrado."
      );
    } catch (error: any) {
      setErrors({
        codigo: "",
        geral:
          error?.response?.data?.message ||
          "Não foi possível reenviar o código.",
      });

      setSuccessMessage("");
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
              Código de Verificação
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Digite o código de 6 dígitos enviado para seu WhatsApp.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              label="Código"
              placeholder="000000"
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                setCodigo(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                );

                if (
                  errors.codigo ||
                  errors.geral ||
                  successMessage
                ) {
                  setErrors({
                    codigo: "",
                    geral: "",
                  });

                  setSuccessMessage("");
                }
              }}
              error={errors.codigo}
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

            {successMessage && (
              <div
                className="
                  rounded-xl
                  border
                  border-green-200
                  bg-green-50
                  p-3
                  text-sm
                  text-green-700
                "
              >
                ✓ {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Validando..."
                : "Confirmar Código"}
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
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          © {new Date().getFullYear()} Aura Soluções Tecnológicas
        </p>
      </div>
    </div>
  );
}