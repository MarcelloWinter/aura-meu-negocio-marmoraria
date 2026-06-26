import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: ButtonVariant;
}

export function Button({
	children,
	variant = "primary",
	className = "",
	...props
}: ButtonProps) {
	const baseStyles = "h-11 w-full rounded-xl font-medium transition";

	const variants: Record<ButtonVariant, string> = {
		primary: "bg-[var(--primary)] text-white hover:opacity-90",
		secondary:
			"bg-white text-[var(--black)] border border-[var(--border)] hover:bg-[var(--background)]",
		ghost:
			"bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)]",
	};

	return (
		<button
			{...props}
			className={`${baseStyles} ${variants[variant]} ${className}`}
		>
			{children}
		</button>
	);
}
