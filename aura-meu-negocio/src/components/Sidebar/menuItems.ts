import {
	Calendar,
	LayoutDashboard,
	MessageSquare,
	Settings,
	Users,
	Wallet,
} from "lucide-react";

export const menuItems = [
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