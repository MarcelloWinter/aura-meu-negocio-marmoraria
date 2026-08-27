import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api, getApiErrorMessage } from "../services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusAgendamento = "concluido" | "cancelado" | "pendente";

export type AgendamentoHistorico = {
	id: string;
	servico: string;
	data: string;
	horario: string;
	status: StatusAgendamento;
};

export type Endereco = {
	cep?: string;
	rua?: string;
	numero?: string;
	complemento?: string;
	bairro?: string;
	cidade?: string;
	estado?: string;
};

export type Cliente = {
	id: string;
	nome: string;
	telefone: string;
	cpfCnpj?: string;
	email?: string;
	endereco?: Endereco;
	avatarCor: string;
	agendamentos: AgendamentoHistorico[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const CORES_AVATAR_CLIENTES = [
	"bg-cyan-400",
	"bg-violet-400",
	"bg-emerald-400",
	"bg-amber-400",
	"bg-rose-400",
	"bg-blue-400",
	"bg-slate-400",
];

// ─── Integração com a API ───────────────────────────────────────────────────────

type ClienteApi = {
	id: string;
	nome: string;
	numero: string;
	empresa_id: string | null;
	cpf_cnpj: string | null;
	email: string | null;
	endereco_cep: string | null;
	endereco_rua: string | null;
	endereco_numero: string | null;
	endereco_complemento: string | null;
	endereco_bairro: string | null;
	endereco_cidade: string | null;
	endereco_estado: string | null;
};

function mapEnderecoApi(row: ClienteApi): Endereco | undefined {
	const endereco: Endereco = {
		cep: row.endereco_cep ?? undefined,
		rua: row.endereco_rua ?? undefined,
		numero: row.endereco_numero ?? undefined,
		complemento: row.endereco_complemento ?? undefined,
		bairro: row.endereco_bairro ?? undefined,
		cidade: row.endereco_cidade ?? undefined,
		estado: row.endereco_estado ?? undefined,
	};
	return Object.values(endereco).some(Boolean) ? endereco : undefined;
}

function mapClienteApi(row: ClienteApi, index: number): Cliente {
	return {
		id: row.id,
		nome: row.nome,
		telefone: row.numero,
		cpfCnpj: row.cpf_cnpj ?? undefined,
		email: row.email ?? undefined,
		endereco: mapEnderecoApi(row),
		avatarCor: CORES_AVATAR_CLIENTES[index % CORES_AVATAR_CLIENTES.length],
		agendamentos: [],
	};
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ClientesContextType = {
	clientes: Cliente[];
	carregando: boolean;
	addCliente: (dados: Omit<Cliente, "id">) => Promise<Cliente>;
	deletarCliente: (id: string) => void;
};

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		let cancelado = false;

		api
			.get<ClienteApi[]>("/clientes")
			.then((res) => {
				if (cancelado) return;
				setClientes(res.data.map(mapClienteApi));
			})
			.catch((err) => {
				console.error("Falha ao carregar clientes:", getApiErrorMessage(err, "Erro desconhecido"));
			})
			.finally(() => {
				if (!cancelado) setCarregando(false);
			});

		return () => {
			cancelado = true;
		};
	}, []);

	async function addCliente(dados: Omit<Cliente, "id">): Promise<Cliente> {
		const res = await api.post<ClienteApi>("/clientes", {
			nome: dados.nome,
			numero: dados.telefone,
			cpfCnpj: dados.cpfCnpj,
			email: dados.email,
			endereco: dados.endereco,
		});

		const novo: Cliente = {
			...mapClienteApi(res.data, clientes.length),
			avatarCor: dados.avatarCor,
		};

		setClientes((prev) => [...prev, novo]);
		return novo;
	}

	function deletarCliente(id: string) {
		setClientes((prev) => prev.filter((c) => c.id !== id));

		api.delete(`/clientes/${id}`).catch((err) => {
			console.error("Falha ao excluir cliente:", getApiErrorMessage(err, "Erro desconhecido"));
		});
	}

	return (
		<ClientesContext.Provider value={{ clientes, carregando, addCliente, deletarCliente }}>
			{children}
		</ClientesContext.Provider>
	);
}

export function useClientes() {
	const ctx = useContext(ClientesContext);
	if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
	return ctx;
}
