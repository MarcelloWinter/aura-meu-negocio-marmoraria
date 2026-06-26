type LogoProps = {
	centered?: boolean;
	size?: "xs" | "sm" | "md" | "lg";
	hideText?: boolean;
};

export function Logo({
	centered = true,
	size = "md",
	hideText = false,
}: LogoProps) {
	const sizes = {
		xs: {
			container: "h-9 w-9",
			text: "text-lg",
		},
		sm: {
			container: "h-10 w-10",
			text: "text-xl",
		},
		md: {
			container: "h-12 w-12",
			text: "text-3xl",
		},
		lg: {
			container: "h-16 w-16",
			text: "text-4xl",
		},
	};

	return (
		<div
			className={`
				flex items-center gap-3
				${centered ? "justify-center" : ""}
			`}
		>
			<div
				className={`
					${sizes[size].container}
					shrink-0
					rounded-2xl
					bg-[var(--primary)]
					flex items-center justify-center
					text-white font-bold
				`}
			>
				A
			</div>

			<div
				className={`
					transition-all
					duration-200
					overflow-hidden
					${hideText ? "w-0 opacity-0" : "w-auto opacity-100"}
				`}
			>
				<h1
					className={`
						${sizes[size].text}
						font-bold
						text-[var(--text)]
						whitespace-nowrap
					`}
				>
					Aura{" "}
					<span className="font-normal text-[var(--text-secondary)]">
						Meu Negócio
					</span>
				</h1>
			</div>
		</div>
	);
}
