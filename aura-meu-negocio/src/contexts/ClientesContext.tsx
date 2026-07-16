import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusAgendamento = "concluido" | "cancelado" | "pendente";

export type AgendamentoHistorico = {
	id: string;
	servico: string;
	data: string;
	horario: string;
	status: StatusAgendamento;
};

export type Cliente = {
	id: string;
	nome: string;
	telefone: string;
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

const MOCK_CLIENTES: Cliente[] = [
	{
		id: "cl1",
		nome: "Ana Beatriz",
		telefone: "(11) 99842-1234",
		avatarCor: "bg-cyan-400",
		agendamentos: [
			{ id: "ag1", servico: "Corte feminino", data: "05/07/2026", horario: "14:00", status: "concluido" },
			{ id: "ag2", servico: "Manicure", data: "20/06/2026", horario: "10:00", status: "concluido" },
			{ id: "ag3", servico: "Avaliação", data: "25/07/2026", horario: "09:30", status: "pendente" },
		],
	},
	{
		id: "cl2",
		nome: "Carlos Mendes",
		telefone: "(21) 98765-4321",
		avatarCor: "bg-amber-400",
		agendamentos: [
			{ id: "ag4", servico: "Corte masculino", data: "10/07/2026", horario: "10:00", status: "concluido" },
			{ id: "ag5", servico: "Barba", data: "10/07/2026", horario: "10:30", status: "concluido" },
			{ id: "ag6", servico: "Corte masculino", data: "28/07/2026", horario: "11:00", status: "pendente" },
		],
	},
	{
		id: "cl3",
		nome: "Marina Lima",
		telefone: "(31) 97654-3210",
		avatarCor: "bg-emerald-400",
		agendamentos: [
			{ id: "ag7", servico: "Manicure", data: "15/07/2026", horario: "09:00", status: "concluido" },
			{ id: "ag8", servico: "Manicure", data: "22/07/2026", horario: "09:00", status: "cancelado" },
		],
	},
	{
		id: "cl4",
		nome: "Rafael Nunes",
		telefone: "(11) 91234-5678",
		avatarCor: "bg-violet-400",
		agendamentos: [
			{ id: "ag9", servico: "Barba", data: "08/07/2026", horario: "08:30", status: "concluido" },
			{ id: "ag10", servico: "Corte masculino", data: "08/07/2026", horario: "09:00", status: "concluido" },
		],
	},
	{
		id: "cl5",
		nome: "Patrícia Nogueira",
		telefone: "(41) 99321-8765",
		avatarCor: "bg-rose-400",
		agendamentos: [
			{ id: "ag11", servico: "Corte feminino", data: "12/07/2026", horario: "15:00", status: "cancelado" },
			{ id: "ag12", servico: "Corte feminino", data: "26/07/2026", horario: "15:00", status: "pendente" },
		],
	},
	{
		id: "cl6",
		nome: "Lucas Andrade",
		telefone: "(61) 98888-7777",
		avatarCor: "bg-blue-400",
		agendamentos: [],
	},
];

// ─── Context ──────────────────────────────────────────────────────────────────

type ClientesContextType = {
	clientes: Cliente[];
	addCliente: (dados: Omit<Cliente, "id">) => Cliente;
	deletarCliente: (id: string) => void;
};

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
	const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES);

	function addCliente(dados: Omit<Cliente, "id">): Cliente {
		const novo: Cliente = { id: crypto.randomUUID(), ...dados };
		setClientes((prev) => [...prev, novo]);
		return novo;
	}

	function deletarCliente(id: string) {
		setClientes((prev) => prev.filter((c) => c.id !== id));
	}

	return (
		<ClientesContext.Provider value={{ clientes, addCliente, deletarCliente }}>
			{children}
		</ClientesContext.Provider>
	);
}

export function useClientes() {
	const ctx = useContext(ClientesContext);
	if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
	return ctx;
}
