import type { ReactNode } from "react";

import { Background } from "./Background";
import { Logo } from "./Logo";

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({
    children,
}: AuthLayoutProps) {
    return (
        <Background>
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <Logo />
                </div>

                {children}

                <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                    © {new Date().getFullYear()} Aura Soluções Tecnológicas
                </p>
            </div>
        </Background>
    );
}