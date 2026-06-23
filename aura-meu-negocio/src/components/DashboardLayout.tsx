import { useState } from "react";
import type { ReactNode } from "react";

import { Sidebar } from "../components/Sidebar/Sidebar";
import { Header } from "../components/Header/Header";

interface DashboardLayoutProps {
	children: ReactNode;
}

export function DashboardLayout({
	children,
}: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] =
		useState(true);

	return (
		<div className="h-screen flex bg-slate-50">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() =>
					setSidebarOpen(false)
				}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<Header
					onMenuClick={() =>
						setSidebarOpen((prev) => !prev)
					}
				/>

				<main className="flex-1 overflow-auto">
					{children}
				</main>
			</div>
		</div>
	);
}