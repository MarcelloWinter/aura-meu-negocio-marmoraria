import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";

interface SidebarContextData {
	isCollapsed: boolean;
	toggleSidebar: () => void;
}

const SidebarContext =
	createContext({} as SidebarContextData);

export function SidebarProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [isCollapsed, setIsCollapsed] =
		useState(false);

	function toggleSidebar() {
		setIsCollapsed((prev) => !prev);
	}

	return (
		<SidebarContext.Provider
			value={{
				isCollapsed,
				toggleSidebar,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	return useContext(SidebarContext);
}