import type { ReactNode } from "react";

interface AuthCardProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthCard({
    title,
    description,
    children,
}: AuthCardProps) {
    return (
        <div className="bg-[var(--card)] rounded-3xl shadow-lg border border-[var(--border)] p-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text)]">
                    {title}
                </h2>

                <p className="text-[var(--text-secondary)] mt-2">
                    {description}
                </p>
            </div>

            {children}
        </div>
    );
}