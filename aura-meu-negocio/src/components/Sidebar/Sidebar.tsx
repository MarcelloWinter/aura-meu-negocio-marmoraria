import {
	Calendar,
	LayoutDashboard,
	MessageSquare,
	Settings,
	Users,
	Wallet,
	LogOut,
	X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

interface SidebarProps {
	isOpen: boolean;
	isCollapsed: boolean;
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

export function Sidebar({
	isOpen,
	isCollapsed,
	onClose,
}: SidebarProps) {
	return (
		<>
			{/* Overlay Mobile */}
			{isOpen && (
				<div
					onClick={onClose}
					className="
						lg:hidden
						fixed
						inset-0
						bg-black/40
						z-40
					"
				/>
			)}

			<aside
				className={`
					fixed lg:static
					top-0 left-0
					h-screen
					bg-white
					border-r
					border-slate-200
					z-50

					transform
					transition-all
					duration-300

					${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}

					${isCollapsed ? "lg:w-20" : "lg:w-72"}

					w-72
					flex
					flex-col
				`}
			>
				{/* Header */}
				<div
					className={`
						h-16
						border-b
						flex
						items-center
						justify-between
						px-5
					`}
				>
					{!isCollapsed && (
						<div>
							<h1 className="font-bold text-lg">
								Aura
							</h1>

							<p className="text-xs text-slate-500">
								Meu Negócio
							</p>
						</div>
					)}

					<button
						onClick={onClose}
						className="lg:hidden"
					>
						<X size={20} />
					</button>
				</div>

				{/* Menu */}
				<nav className="flex-1 p-3">
					<div className="space-y-2">
						{menu.map((item) => {
							const Icon = item.icon;

							return (
								<NavLink
									key={item.path}
									to={item.path}
									className={({ isActive }) =>
										`
										flex
										items-center
										gap-3
										px-4
										py-3
										rounded-xl
										transition-all

										${
											isActive
												? "bg-blue-50 text-blue-600"
												: "hover:bg-slate-100"
										}

										${
											isCollapsed
												? "justify-center"
												: ""
										}
									`
									}
								>
									<Icon size={20} />

									{!isCollapsed && (
										<span>
											{item.label}
										</span>
									)}
								</NavLink>
							);
						})}
					</div>
				</nav>

				{/* Usuário */}
				<div className="border-t p-4">
					<div
						className={`
							flex
							items-center
							gap-3
							mb-4

							${
								isCollapsed
									? "justify-center"
									: ""
							}
						`}
					>
						<div
							className="
								w-10
								h-10
								rounded-full
								bg-blue-600
								text-white
								font-semibold
								flex
								items-center
								justify-center
							"
						>
							MW
						</div>

						{!isCollapsed && (
							<div>
								<div className="font-medium">
									Marcello
								</div>

								<div className="text-xs text-slate-500">
									Administrador
								</div>
							</div>
						)}
					</div>

					<button
						className={`
							w-full
							flex
							items-center
							gap-3
							px-3
							py-2
							rounded-lg
							hover:bg-red-50
							hover:text-red-600
							transition

							${
								isCollapsed
									? "justify-center"
									: ""
							}
						`}
					>
						<LogOut size={18} />

						{!isCollapsed && (
							<span>Sair</span>
						)}
					</button>
				</div>
			</aside>
		</>
	);
}