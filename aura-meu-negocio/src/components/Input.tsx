import { FormError } from "./FormError";

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        {...props}
        className={`
          h-11
          rounded-xl
          border
          px-4
          transition-all

          ${
            error
              ? "border-red-500"
              : "border-[var(--border)]"
          }

          focus:outline-none
          focus:border-[var(--primary)]
        `}
      />

      <FormError message={error} />
    </div>
  );
}