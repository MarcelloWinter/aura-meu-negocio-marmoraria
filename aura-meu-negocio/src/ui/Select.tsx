import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

import { FormError } from "../components/FormError";

export interface SelectOption {
	label: string;
	value: string;
}

interface SelectProps {
	label: string;
	error?: string;
	options: SelectOption[];
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	renderOption?: (option: SelectOption) => React.ReactNode;
}

export function Select({
	label,
	error,
	options,
	placeholder,
	value,
	onChange,
	renderOption,
}: SelectProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((o) => o.value === value);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>

			<div ref={containerRef} className="relative">
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					className={`
						flex h-11 w-full items-center justify-between rounded-xl border
						bg-white px-4 text-left transition-all
						focus:outline-none
						${
							error
								? "border-red-500"
								: open
									? "border-[var(--primary)]"
									: "border-[var(--border)]"
						}
					`}
				>
					<span
						className={`flex items-center gap-2 text-sm ${
							selectedOption ? "text-[var(--text)]" : "text-slate-400"
						}`}
					>
						{selectedOption
							? renderOption
								? renderOption(selectedOption)
								: selectedOption.label
							: placeholder}
					</span>

					<ChevronDown
						size={16}
						className={`shrink-0 text-slate-400 transition-transform duration-150 ${
							open ? "rotate-180" : ""
						}`}
					/>
				</button>

				{open && (
					<div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg">
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value);
									setOpen(false);
								}}
								className={`
									flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm
									transition-colors hover:bg-slate-50
									${
										option.value === value
											? "bg-blue-50 font-medium text-[var(--primary)]"
											: "text-[var(--text)]"
									}
								`}
							>
								{renderOption ? renderOption(option) : option.label}
							</button>
						))}
					</div>
				)}
			</div>

			<FormError message={error} />
		</div>
	);
}
