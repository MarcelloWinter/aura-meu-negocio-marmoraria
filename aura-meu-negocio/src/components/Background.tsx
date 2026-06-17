import type { ReactNode } from "react";

type BackgroundProps = {
    children: ReactNode;
};

export function Background({
    children,
}: BackgroundProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}