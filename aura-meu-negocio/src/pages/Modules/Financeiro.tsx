import { useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { Modal } from "../../ui/Modal";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoTransacao = "receita" | "despesa";
type StatusConta = "em_dia" | "atrasado" | "pago";

type Transacao = {
	id: string;
	descricao: string;
	tipo: TipoTransacao;
	valor: number;
	vencimento: string; // "DD/MM"
	status: StatusConta;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number, decimais = true): string {
	return (
		"R$ " +
		value.toLocaleString("pt-BR", {
			minimumFractionDigits: decimais ? 2 : 0,
			maximumFractionDigits: decimais ? 2 : 0,
		})
	);
}

function isoParaDDMM(iso: string): string {
	if (!iso) return "";
	const [, m, d] = iso.split("-");
	return `${d}/${m}`;
}

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

// Saldo diário simulado para julho de 2026 (31 dias)
const FLUXO_CAIXA: { dia: number; saldo: number }[] = (() => {
	const entradas = [
		{ dia: 3, valor: 1800 },
		{ dia: 5, valor: 2400 },
		{ dia: 6, valor: 1600 },
		{ dia: 8, valor: 900 },
		{ dia: 10, valor: 3200 },
		{ dia: 15, valor: 2800 },
		{ dia: 18, valor: 1400 },
		{ dia: 20, valor: 1800 },
		{ dia: 25, valor: 1250 },
	];
	const saidas = [
		{ dia: 1, valor: 3130 },
		{ dia: 5, valor: 120 },
		{ dia: 8, valor: 200 },
	];
	let saldo = 5000;
	return Array.from({ length: 31 }, (_, i) => {
		const dia = i + 1;
		entradas.filter((e) => e.dia === dia).forEach((e) => { saldo += e.valor; });
		saidas.filter((s) => s.dia === dia).forEach((s) => { saldo -= s.valor; });
		return { dia, saldo };
	});
})();

// ─── Gráfico ──────────────────────────────────────────────────────────────────

function FluxoCaixaChart({ dados }: { dados: { dia: number; saldo: number }[] }) {
	const W = 1000;
	const H = 160;
	const padT = 12;

	const max = Math.max(...dados.map((d) => d.saldo));
	const min = Math.min(...dados.map((d) => d.saldo), 0);
	const range = max - min || 1;

	const toX = (i: number) => (i / (dados.length - 1)) * W;
	const toY = (v: number) => padT + (H - padT) - ((v - min) / range) * (H - padT);

	const pts = dados.map((d, i) => ({ x: toX(i), y: toY(d.saldo) }));

	const linePath = pts.reduce((acc, p, i) => {
		if (i === 0) return `M ${p.x},${p.y}`;
		const prev = pts[i - 1];
		const cx = (prev.x + p.x) / 2;
		return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
	}, "");

	const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

	const LABEL_DIAS = [1, 5, 10, 15, 20, 25, 31];

	return (
		<div>
			<svg
				viewBox={`0 0 ${W} ${H}`}
				className="w-full"
				style={{ height: 160, display: "block" }}
				preserveAspectRatio="none"
			>
				<defs>
					<linearGradient id="fluxoGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
						<stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
					</linearGradient>
				</defs>
				<path d={areaPath} fill="url(#fluxoGrad)" />
				<path
					d={linePath}
					fill="none"
					stroke="#3B82F6"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>

			{/* Eixo X */}
			<div className="relative mt-1 h-5">
				{LABEL_DIAS.map((dia) => {
					const i = dia - 1;
					const pct = (i / (dados.length - 1)) * 100;
					return (
						<span
							key={dia}
							className="absolute -translate-x-1/2 text-[11px] text-blue-400"
							style={{ left: `${pct}%` }}
						>
							{dia}
						</span>
					);
				})}
			</div>
		</div>
	);
}

// ─── Badge de status ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusConta, { label: string; className: string }> = {
	em_dia: { label: "Em dia", className: "bg-teal-100 text-teal-700" },
	atrasado: { label: "Atrasado", className: "bg-red-100 text-red-600" },
	pago: { label: "Pago", className: "bg-slate-100 text-slate-500" },
};

function StatusBadge({ status }: { status: StatusConta }) {
	const { label, className } = STATUS_CONFIG[status];
	return (
		<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
			{label}
		</span>
	);
}

// ─── Modal de nova transação ──────────────────────────────────────────────────

const ERROS_VAZIOS = { descricao: "", valor: "", vencimento: "" };

function NovaTransacaoModal({
	tipo,
	isOpen,
	onClose,
	onSave,
}: {
	tipo: TipoTransacao;
	isOpen: boolean;
	onClose: () => void;
	onSave: (t: Omit<Transacao, "id">) => void;
}) {
	const [descricao, setDescricao] = useState("");
	const [valor, setValor] = useState("");
	const [vencimento, setVencimento] = useState("");
	const [errors, setErrors] = useState(ERROS_VAZIOS);

	function limpar() {
		setDescricao("");
		setValor("");
		setVencimento("");
		setErrors(ERROS_VAZIOS);
	}

	function handleClose() {
		limpar();
		onClose();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const v = parseFloat(valor.replace(",", "."));
		const novosErros = {
			descricao: descricao.trim() ? "" : "Informe a descrição.",
			valor: !valor ? "Informe o valor." : isNaN(v) || v <= 0 ? "Valor inválido." : "",
			vencimento: vencimento ? "" : "Informe o vencimento.",
		};
		setErrors(novosErros);
		if (Object.values(novosErros).some(Boolean)) return;

		onSave({
			descricao: descricao.trim(),
			tipo,
			valor: v,
			vencimento: isoParaDDMM(vencimento),
			status: "em_dia",
		});
		limpar();
	}

	const titulo = tipo === "receita" ? "Nova receita" : "Nova despesa";
	const labelDescricao = tipo === "receita" ? "Cliente / Descrição" : "Descrição";
	const placeholderDescricao = tipo === "receita" ? "Nome do cliente ou serviço" : "Ex: Aluguel, Energia…";

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={titulo}>
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label={labelDescricao}
					placeholder={placeholderDescricao}
					autoFocus
					value={descricao}
					onChange={(e) => setDescricao(e.target.value)}
					error={errors.descricao}
				/>
				<Input
					label="Valor (R$)"
					type="number"
					min="0.01"
					step="0.01"
					placeholder="0,00"
					value={valor}
					onChange={(e) => setValor(e.target.value)}
					error={errors.valor}
				/>
				<Input
					label="Vencimento"
					type="date"
					value={vencimento}
					onChange={(e) => setVencimento(e.target.value)}
					error={errors.vencimento}
				/>
				<div className="flex justify-end gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						className="!w-auto px-5"
						onClick={handleClose}
					>
						Cancelar
					</Button>
					<Button type="submit" className="!w-auto px-5">
						Salvar
					</Button>
				</div>
			</form>
		</Modal>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Financeiro() {
	const [transacoes, setTransacoes] = useState<Transacao[]>(MOCK_TRANSACOES);
	const [modalAberto, setModalAberto] = useState<TipoTransacao | null>(null);

	const totalEntradas = transacoes
		.filter((t) => t.tipo === "receita")
		.reduce((s, t) => s + t.valor, 0);

	const totalSaidas = transacoes
		.filter((t) => t.tipo === "despesa")
		.reduce((s, t) => s + t.valor, 0);

	const saldo = totalEntradas - totalSaidas;

	const contasReceber = transacoes.filter(
		(t) => t.tipo === "receita" && t.status !== "pago",
	);

	const contasPagar = transacoes.filter(
		(t) => t.tipo === "despesa" && t.status !== "pago",
	);

	function addTransacao(dados: Omit<Transacao, "id">) {
		setTransacoes((prev) => [...prev, { id: crypto.randomUUID(), ...dados }]);
		setModalAberto(null);
	}

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
							Financeiro
						</h1>
						<p className="mt-1 text-sm text-slate-500">
							Resumo simples do seu mês.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => setModalAberto("despesa")}
							className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
						>
							<Plus size={14} />
							Nova despesa
						</button>
						<button
							onClick={() => setModalAberto("receita")}
							className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
						>
							<Plus size={14} />
							Nova receita
						</button>
					</div>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 space-y-5 overflow-auto p-4 sm:p-6">
					{/* Cards de resumo */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{/* Entradas */}
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-green-600">
								<TrendingUp size={15} />
								<span className="text-sm font-medium">Entradas</span>
							</div>
							<p className="text-2xl font-bold text-slate-900">
								{formatBRL(totalEntradas, false)}
							</p>
							<p className="mt-1 text-xs text-slate-400">+12% vs mês anterior</p>
						</div>

						{/* Saídas */}
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-red-500">
								<TrendingDown size={15} />
								<span className="text-sm font-medium">Saídas</span>
							</div>
							<p className="text-2xl font-bold text-slate-900">
								{formatBRL(totalSaidas, false)}
							</p>
							<p className="mt-1 text-xs text-slate-400">-4% vs mês anterior</p>
						</div>

						{/* Saldo */}
						<div className="rounded-2xl bg-blue-600 p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-blue-200">
								<Wallet size={15} />
								<span className="text-sm font-medium">Saldo</span>
							</div>
							<p className="text-2xl font-bold text-white">
								{formatBRL(saldo, false)}
							</p>
							<p className="mt-1 text-xs text-blue-300">Saldo disponível</p>
						</div>
					</div>

					{/* Fluxo de caixa */}
					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<h2 className="mb-4 text-base font-semibold text-slate-800">
							Fluxo de caixa
						</h2>
						<FluxoCaixaChart dados={FLUXO_CAIXA} />
					</div>

					{/* Contas */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{/* Contas a receber */}
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<h2 className="mb-4 text-base font-semibold text-slate-800">
								Contas a receber
							</h2>
							<div className="divide-y divide-slate-100">
								{contasReceber.length === 0 ? (
									<p className="py-2 text-sm text-slate-400">
										Nenhuma conta pendente.
									</p>
								) : (
									contasReceber.map((t) => (
										<div
											key={t.id}
											className="flex items-center justify-between gap-3 py-3"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-slate-800">
													{t.descricao}
												</p>
												<p className="text-xs text-slate-400">
													Vence em {t.vencimento}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-3">
												<StatusBadge status={t.status} />
												<span className="text-sm font-semibold text-slate-800">
													{formatBRL(t.valor)}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</div>

						{/* Contas a pagar */}
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<h2 className="mb-4 text-base font-semibold text-slate-800">
								Contas a pagar
							</h2>
							<div className="divide-y divide-slate-100">
								{contasPagar.length === 0 ? (
									<p className="py-2 text-sm text-slate-400">
										Nenhuma conta pendente.
									</p>
								) : (
									contasPagar.map((t) => (
										<div
											key={t.id}
											className="flex items-center justify-between gap-2 py-3"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-slate-800">
													{t.descricao}
												</p>
												<p className="text-xs text-slate-400">
													Vence em {t.vencimento}
												</p>
											</div>
											<span className="shrink-0 text-sm font-semibold text-slate-800">
												{formatBRL(t.valor)}
											</span>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<NovaTransacaoModal
				tipo={modalAberto ?? "receita"}
				isOpen={modalAberto !== null}
				onClose={() => setModalAberto(null)}
				onSave={addTransacao}
			/>
		</DashboardLayout>
	);
}
