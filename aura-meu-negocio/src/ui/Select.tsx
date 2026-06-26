import { ChevronDown } from "lucide-react";

import { FormError } from "../components/FormError";

interface SelectOption {
	label: string;
	value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	error?: string;
	options: SelectOption[];
	placeholder?: string;
}

export function Select({
	label,
	error,
	options,
	placeholder,
	className = "",
	...props
}: SelectProps) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>

			<div className="relative">
				<select
					{...props}
					className={`
						h-11
						w-full
						appearance-none
						rounded-xl
						border
						px-4
						pr-10
						transition-all

						${error ? "border-red-500" : "border-[var(--border)]"}

						focus:outline-none
						focus:border-[var(--primary)]

						${className}
					`}
				>
					{placeholder && (
						<option value="" disabled hidden>
							{placeholder}
						</option>
					)}

					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<ChevronDown
					size={16}
					className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
				/>
			</div>

			<FormError message={error} />
		</div>
	);
}
