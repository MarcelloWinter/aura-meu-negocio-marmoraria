type LogoProps = {
    centered?: boolean;
    size?: "sm" | "md" | "lg";
};

export function Logo({
    centered = true,
    size = "md",
}: LogoProps) {
    const sizes = {
        sm: {
            container: "h-8 w-8",
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
            className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
        >
            <div
                className={`${sizes[size].container} rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white font-bold`}
            >
                A
            </div>

            <h1
                className={`${sizes[size].text} font-bold text-[var(--text)]`}
            >
                Aura{" "}
                <span className="font-normal text-[var(--text-secondary)]">
                    Meu Negócio
                </span>
            </h1>
        </div>
    );
}