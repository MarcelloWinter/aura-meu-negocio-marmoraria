import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoTransacao = "receita" | "despesa";
export type StatusConta = "em_dia" | "atrasado" | "pago";

export type FormaPagamento = "dinheiro" | "cartao" | "pix" | "cheque" | "ted";

export type Pagamento = {
	id: string;
	valor: number;
	data: string; // YYYY-MM-DD
	forma: FormaPagamento;
};

export type Transacao = {
	id: string;
	descricao: string;
	tipo: TipoTransacao;
	clienteId?: string;
	categoria?: string;
	valor: number;
	vencimento: string; // "DD/MM"
	status: StatusConta;
	pagamentos?: Pagamento[];
};

// ─── Dados mockados ───────────────────────────────────────────────────────────

const MOCK_TRANSACOES: Transacao[] = [
	// Receitas pagas (7 clientes, totalizam R$ 17.150 já recebidos)
	{ id: "r1", descricao: "Ana C.", tipo: "receita", valor: 1800, vencimento: "03/07", status: "pago" },
	{ id: "r2", descricao: "Carlos R.", tipo: "receita", valor: 2400, vencimento: "05/07", status: "pago" },
	{ id: "r3", descricao: "Julia M.", tipo: "receita", valor: 1600, vencimento: "06/07", status: "pago" },
	{ id: "r4", descricao: "Fernanda S.", tipo: "receita", valor: 900, vencimento: "08/07", status: "pago" },
	{ id: "r5", descricao: "Roberto K.", tipo: "receita", valor: 3200, vencimento: "10/07", status: "pago" },
	{ id: "r6", descricao: "Alice B.", tipo: "receita", valor: 2800, vencimento: "15/07", status: "pago" },
	{ id: "r7", descricao: "Rodrigo F.", tipo: "receita", valor: 1400, vencimento: "18/07", status: "pago" },
	{ id: "r8", descricao: "Patricia N.", tipo: "receita", valor: 1800, vencimento: "20/07", status: "pago" },
	{ id: "r9", descricao: "Mariana A.", tipo: "receita", valor: 1250, vencimento: "25/07", status: "pago" },
	// Receitas pendentes (somam R$ 1.270 restantes → total = R$ 18.420)
	{ id: "r10", descricao: "Marina L.", tipo: "receita", valor: 320, vencimento: "10/07", status: "em_dia" },
	{ id: "r11", descricao: "Pedro Lima", tipo: "receita", valor: 80, vencimento: "12/07", status: "em_dia" },
	{ id: "r12", descricao: "Beatriz S.", tipo: "receita", valor: 150, vencimento: "05/07", status: "atrasado" },
	{ id: "r13", descricao: "Lucas M.", tipo: "receita", valor: 240, vencimento: "18/07", status: "em_dia" },
	{ id: "r14", descricao: "Gustavo L.", tipo: "receita", valor: 480, vencimento: "22/07", status: "em_dia" },
	// Despesas pagas (somam R$ 3.450)
	{ id: "d1", descricao: "Salários", tipo: "despesa", valor: 3130, vencimento: "01/07", status: "pago" },
	{ id: "d2", descricao: "Internet", tipo: "despesa", valor: 120, vencimento: "05/07", status: "pago" },
	{ id: "d3", descricao: "Água", tipo: "despesa", valor: 200, vencimento: "08/07", status: "pago" },
	// Despesas pendentes (somam R$ 3.700 → total despesas = R$ 7.150)
	{ id: "d4", descricao: "Aluguel", tipo: "despesa", valor: 2400, vencimento: "10/07", status: "em_dia" },
	{ id: "d5", descricao: "Energia", tipo: "despesa", valor: 380, vencimento: "15/07", status: "em_dia" },
	{ id: "d6", descricao: "Produtos beleza", tipo: "despesa", valor: 920, vencimento: "20/07", status: "em_dia" },
];

// ─── Context ──────────────────────────────────────────────────────────────────

type FinanceiroContextType = {
	transacoes: Transacao[];
	addTransacao: (dados: Omit<Transacao, "id">) => Transacao;
	deletarTransacao: (id: string) => void;
	registrarPagamento: (id: string, pag: Omit<Pagamento, "id">) => void;
};

const FinanceiroContext = createContext<FinanceiroContextType | null>(null);

export function FinanceiroProvider({ children }: { children: ReactNode }) {
	const [transacoes, setTransacoes] = useState<Transacao[]>(MOCK_TRANSACOES);

	function addTransacao(dados: Omit<Transacao, "id">): Transacao {
		const nova: Transacao = { id: crypto.randomUUID(), ...dados };
		setTransacoes((prev) => [...prev, nova]);
		return nova;
	}

	function deletarTransacao(id: string) {
		setTransacoes((prev) => prev.filter((t) => t.id !== id));
	}

	function registrarPagamento(id: string, pag: Omit<Pagamento, "id">) {
		setTransacoes((prev) =>
			prev.map((t) => {
				if (t.id !== id) return t;
				const pagamentos = [...(t.pagamentos ?? []), { id: crypto.randomUUID(), ...pag }];
				const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
				const status: StatusConta = totalPago >= t.valor - 0.001 ? "pago" : t.status;
				return { ...t, pagamentos, status };
			}),
		);
	}

	return (
		<FinanceiroContext.Provider
			value={{ transacoes, addTransacao, deletarTransacao, registrarPagamento }}
		>
			{children}
		</FinanceiroContext.Provider>
	);
}

export function useFinanceiro() {
	const ctx = useContext(FinanceiroContext);
	if (!ctx) throw new Error("useFinanceiro must be used within FinanceiroProvider");
	return ctx;
}
