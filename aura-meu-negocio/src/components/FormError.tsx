interface FormErrorProps {
  message?: string;
}

export function FormError({
  message,
}: FormErrorProps) {
  if (!message) return null;

  return (
    <span className="text-sm text-red-500">
      {message}
    </span>
  );
}