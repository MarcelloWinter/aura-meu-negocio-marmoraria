import {
	Calendar,
	LayoutDashboard,
	MessageSquare,
	Settings,
	Users,
	Wallet,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { Logo } from "../Logo";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const menu = [
	{
		label: "Dashboard",
		path: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Atendimento",
		path: "/atendimento",
		icon: MessageSquare,
	},
	{
		label: "Agenda",
		path: "/agenda",
		icon: Calendar,
	},
	{
		label: "Financeiro",
		path: "/financeiro",
		icon: Wallet,
	},
	{
		label: "Equipe",
		path: "/equipe",
		icon: Users,
	},
	{
		label: "Configurações",
		path: "/configuracoes",
		icon: Settings,
	},
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	return (
		<>
			{isOpen && (
				<div
					onClick={onClose}
					className="lg:hidden fixed inset-0 bg-black/40 z-40"
				/>
			)}

			<aside
				className={`
					fixed lg:relative
					top-0 left-0
					h-screen
					bg-white
					border-r
					border-slate-200
					z-50
					overflow-hidden

					transition-all
					duration-300

					${isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"}
				`}
			>
				<div className="h-16 border-b px-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-16 border-b px-4 flex items-center justify-between">
							<Logo
								centered={!isOpen}
								size={isOpen ? "sm" : "xs"}
								hideText={!isOpen}
							/>
						</div>
					</div>
				</div>

				<nav className="p-4 space-y-2">
					{menu.map((item) => {
						const Icon = item.icon;

						return (
							<NavLink
								key={item.path}
								to={item.path}
								onClick={onClose}
								title={!isOpen ? item.label : ""} // 👈 tooltip simples
								className={({ isActive }) =>
									`
										flex items-center
										${isOpen ? "gap-3 px-4 justify-start" : "justify-center px-2"}
										py-3
										rounded-xl
										transition

										${isActive ? "bg-blue-50 text-blue-600" : "hover:bg-slate-100"}
									`
								}
							>
								<Icon size={18} />

								<span
									className={`
										transition-all
										duration-200
										whitespace-nowrap
										${isOpen ? "opacity-100 ml-0" : "opacity-0 w-0 overflow-hidden"}
									`}
								>
									{item.label}
								</span>
							</NavLink>
						);
					})}
				</nav>
			</aside>
		</>
	);
}
