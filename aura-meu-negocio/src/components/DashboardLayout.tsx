import { useState } from "react";

import type { ReactNode } from "react";

import { Sidebar } from "../components/Sidebar/Sidebar";
import { Header } from "../components/Header/Header";

interface Props {
	children: ReactNode;
}

export function DashboardLayout({
	children,
}: Props) {
	const [sidebarOpen, setSidebarOpen] =
		useState(false);

	const [collapsed, setCollapsed] =
		useState(false);

	return (
		<div className="h-screen flex bg-slate-50">
			<Sidebar
				isOpen={sidebarOpen}
				isCollapsed={collapsed}
				onClose={() =>
					setSidebarOpen(false)
				}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<Header
					onMenuClick={() =>
						setSidebarOpen(true)
					}
					onCollapseClick={() =>
						setCollapsed(!collapsed)
					}
					isCollapsed={collapsed}
				/>

				<main className="flex-1 overflow-auto">
					{children}
				</main>
			</div>
		</div>
	);
}