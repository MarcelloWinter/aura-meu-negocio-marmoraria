import { createContext, useContext, useState, type ReactNode } from "react";

interface Usuario {
	id: number;
	nome: string;
	empresaId: number;
}

interface AuthContextData {
	token: string | null;
	usuario: Usuario | null;
	login: (token: string, usuario: Usuario) => void;
	logout: () => void;
}

const AuthContext = createContext({} as AuthContextData);

function getStoredUsuario(): Usuario | null {
	const raw = localStorage.getItem("@aura:user");

	if (!raw) return null;

	try {
		return JSON.parse(raw) as Usuario;
	} catch {
		return null;
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem("@aura:token")
	);

	const [usuario, setUsuario] = useState<Usuario | null>(() =>
		getStoredUsuario()
	);

	function login(novoToken: string, novoUsuario: Usuario) {
		localStorage.setItem("@aura:token", novoToken);
		localStorage.setItem("@aura:user", JSON.stringify(novoUsuario));

		setToken(novoToken);
		setUsuario(novoUsuario);
	}

	function logout() {
		localStorage.removeItem("@aura:token");
		localStorage.removeItem("@aura:user");

		setToken(null);
		setUsuario(null);
	}

	return (
		<AuthContext.Provider value={{ token, usuario, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	return useContext(AuthContext);
}
