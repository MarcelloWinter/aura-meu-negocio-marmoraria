import type { ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
}

export function Card({
	children,
	className = "",
}: CardProps) {
	return (
		<div
			className={`
				bg-white
				border
				border-slate-200
				rounded-3xl
				shadow-sm
				${className}
			`}
		>
			{children}
		</div>
	);
}