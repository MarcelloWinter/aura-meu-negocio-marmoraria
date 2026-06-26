import { FormError } from "../components/FormError";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
	error?: string;
}

export function Textarea({
	label,
	error,
	className = "",
	...props
}: TextareaProps) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>

			<textarea
				{...props}
				className={`
					rounded-xl
					border
					px-4
					py-3
					transition-all

					${error ? "border-red-500" : "border-[var(--border)]"}

					focus:outline-none
					focus:border-[var(--primary)]

					${className}
				`}
			/>

			<FormError message={error} />
		</div>
	);
}
