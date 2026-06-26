import { Bell, Menu } from "lucide-react";

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	return (
		<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
			<div className="flex items-center gap-3">
				<button
					onClick={onMenuClick}
					className="p-2 rounded-lg hover:bg-slate-100"
				>
					<Menu size={20} />
				</button>

				<h2 className="font-semibold">Marmoraria Decore Granitos</h2>
			</div>

			<div className="flex items-center gap-4">
				<button>
					<Bell size={20} />
				</button>

				<div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
					MW
				</div>
			</div>
		</header>
	);
}
