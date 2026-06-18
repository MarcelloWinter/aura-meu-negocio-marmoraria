import {
	Bell,
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
} from "lucide-react";

interface HeaderProps {
	onMenuClick: () => void;
	onCollapseClick: () => void;
	isCollapsed: boolean;
}

export function Header({
	onMenuClick,
	onCollapseClick,
	isCollapsed,
}: HeaderProps) {
	return (
		<header
			className="
				h-16
				bg-white
				border-b
				border-slate-200
				flex
				items-center
				justify-between
				px-6
			"
		>
			<div className="flex items-center gap-3">
				<button
					onClick={onMenuClick}
					className="lg:hidden"
				>
					<Menu size={22} />
				</button>

				<button
					onClick={onCollapseClick}
					className="hidden lg:block"
				>
					{isCollapsed ? (
						<PanelLeftOpen size={20} />
					) : (
						<PanelLeftClose size={20} />
					)}
				</button>

				<h2 className="font-semibold">
					Aura Meu Negócio
				</h2>
			</div>

			<div className="flex items-center gap-4">
				<button>
					<Bell size={20} />
				</button>

				<div
					className="
						w-10
						h-10
						rounded-full
						bg-blue-600
						text-white
						flex
						items-center
						justify-center
						font-semibold
					"
				>
					MW
				</div>
			</div>
		</header>
	);
}