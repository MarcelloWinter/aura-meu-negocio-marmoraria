import { NavLink } from "react-router-dom";

import { useSidebar } from "../../contexts/SidebarContext";

interface Props {
	item: {
		label: string;
		path: string;
		icon: any;
	};
}

export function SidebarItem({
	item,
}: Props) {
	const { isCollapsed } =
		useSidebar();

	const Icon = item.icon;

	return (
		<NavLink
			to={item.path}
			className={({ isActive }) =>
				`
				flex
				items-center
				gap-3
				px-3
				py-3
				rounded-xl
				mb-1

				${
					isActive
						? "bg-cyan-100 text-cyan-700"
						: "hover:bg-slate-100"
				}
			`
			}
		>
			<Icon size={20} />

			{!isCollapsed && (
				<span>{item.label}</span>
			)}
		</NavLink>
	);
}