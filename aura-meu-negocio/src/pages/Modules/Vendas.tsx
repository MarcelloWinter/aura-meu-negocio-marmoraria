import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Plus,
	X,
	Trash2,
	ArrowRight,
	ChevronRight,
	Package,
	Wallet,
	ShoppingCart,
} from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { Modal } from "../../ui/Modal";
import { Textarea } from "../../ui/Textarea";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { ClienteSelect } from "../../components/ClienteSelect";
import type { Cliente } from "../../contexts/ClientesContext";
import { useFinanceiro } from "../../contexts/FinanceiroContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusVenda = "orcamento" | "aprovado" | "producao" | "entregue";

export type ItemVenda = {
	id: string;
	descricao: string;
	quantidade: number;
	valorUnitario: number;
};

export type Venda = {
	id: string;
	cliente: string;
	clienteId?: string;
	itens: ItemVenda[];
	data: string; // YYYY-MM-DD
	status: StatusVenda;
	observacoes?: string;
	transacaoId?: string; // vincula à receita gerada no Financeiro ao aprovar
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

function isoParaDDMMAAAA(iso: string): string {
	if (!iso) return "";
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

function hojeISO(): string {
	return new Date().toISOString().split("T")[0];
}

function parseNum(s: string): number {
	const n = parseFloat(s.replace(",", "."));
	return isNaN(n) ? 0 : n;
}

function totalVenda(venda: Venda): number {
	return venda.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
}

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join("");
}

// ─── Pipeline de status ───────────────────────────────────────────────────────

const ORDEM_STATUS: StatusVenda[] = ["orcamento", "aprovado", "producao", "entregue"];

const STATUS_CONFIG: Record<StatusVenda, { label: string; pontoCor: string; badgeClass: string }> = {
	orcamento: { label: "Orçamento", pontoCor: "bg-slate-400", badgeClass: "bg-slate-100 text-slate-600" },
	aprovado: { label: "Aprovado", pontoCor: "bg-blue-500", badgeClass: "bg-blue-100 text-blue-700" },
	producao: { label: "Em produção", pontoCor: "bg-amber-500", badgeClass: "bg-amber-100 text-amber-700" },
	entregue: { label: "Entregue", pontoCor: "bg-emerald-500", badgeClass: "bg-emerald-100 text-emerald-700" },
};

const PROXIMA_ETAPA_LABEL: Partial<Record<StatusVenda, string>> = {
	orcamento: "Aprovar orçamento",
	aprovado: "Iniciar produção",
	producao: "Marcar como entregue",
};

function proximoStatus(status: StatusVenda): StatusVenda | null {
	const idx = ORDEM_STATUS.indexOf(status);
	return idx < ORDEM_STATUS.length - 1 ? ORDEM_STATUS[idx + 1] : null;
}

function StatusBadge({ status }: { status: StatusVenda }) {
	const { label, badgeClass } = STATUS_CONFIG[status];
	return (
		<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
			{label}
		</span>
	);
}

// ─── Dados mockados ───────────────────────────────────────────────────────────

const MOCK_VENDAS: Venda[] = [
	{
		id: "v1",
		cliente: "Ana Beatriz",
		data: "2026-07-18",
		status: "orcamento",
		itens: [
			{ id: "i1", descricao: "Bancada granito preto são gabriel (m²)", quantidade: 3.2, valorUnitario: 650 },
			{ id: "i2", descricao: "Instalação", quantidade: 1, valorUnitario: 300 },
		],
	},
	{
		id: "v2",
		cliente: "Carlos Mendes",
		data: "2026-07-10",
		status: "aprovado",
		itens: [
			{ id: "i3", descricao: "Soleira mármore branco (m)", quantidade: 8, valorUnitario: 180 },
		],
	},
	{
		id: "v3",
		cliente: "Marina Lima",
		data: "2026-07-05",
		status: "producao",
		observacoes: "Cliente pediu para priorizar — mudança marcada para dia 30.",
		itens: [
			{ id: "i4", descricao: "Bancada quartzo branco (m²)", quantidade: 2.4, valorUnitario: 890 },
			{ id: "i5", descricao: "Cuba embutida", quantidade: 1, valorUnitario: 420 },
			{ id: "i6", descricao: "Instalação", quantidade: 1, valorUnitario: 350 },
		],
	},
	{
		id: "v4",
		cliente: "Rafael Nunes",
		data: "2026-06-22",
		status: "entregue",
		itens: [
			{ id: "i7", descricao: "Soleira granito cinza (m)", quantidade: 5, valorUnitario: 160 },
		],
	},
	{
		id: "v5",
		cliente: "Patrícia Nogueira",
		data: "2026-07-24",
		status: "orcamento",
		itens: [
			{ id: "i8", descricao: "Bancada granito branco dallas (m²)", quantidade: 4.1, valorUnitario: 610 },
		],
	},
];

// ─── Card de venda (kanban) ───────────────────────────────────────────────────

function VendaCard({ venda, onClick }: { venda: Venda; onClick: () => void }) {
	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => e.key === "Enter" && onClick()}
			className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
		>
			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
					{getInitials(venda.cliente)}
				</div>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
					{venda.cliente}
				</p>
			</div>
			<p className="mt-2.5 text-base font-bold text-slate-800">
				{formatBRL(totalVenda(venda))}
			</p>
			<div className="mt-2 flex items-center justify-between text-xs text-slate-400">
				<span className="flex items-center gap-1">
					<Package size={11} />
					{venda.itens.length} {venda.itens.length === 1 ? "item" : "itens"}
				</span>
				<span>{isoParaDDMM(venda.data)}</span>
			</div>
		</div>
	);
}

// ─── Modal de nova venda ──────────────────────────────────────────────────────

type ItemForm = {
	id: string;
	descricao: string;
	quantidade: string;
	valorUnitario: string;
};

function novoItemVazio(): ItemForm {
	return { id: crypto.randomUUID(), descricao: "", quantidade: "1", valorUnitario: "" };
}

const ITEM_INPUT =
	"w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";

type ErrosItem = { descricao?: string; quantidade?: string; valorUnitario?: string };

function NovaVendaModal({
	isOpen,
	onClose,
	onSave,
}: {
	isOpen: boolean;
	onClose: () => void;
	onSave: (venda: Venda) => void;
}) {
	const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
	const [itens, setItens] = useState<ItemForm[]>([novoItemVazio()]);
	const [data, setData] = useState(hojeISO());
	const [observacoes, setObservacoes] = useState("");
	const [erroCliente, setErroCliente] = useState("");
	const [erroData, setErroData] = useState("");
	const [erroItensGeral, setErroItensGeral] = useState("");
	const [errosItens, setErrosItens] = useState<Record<string, ErrosItem>>({});

	const total = itens.reduce((s, it) => s + parseNum(it.quantidade) * parseNum(it.valorUnitario), 0);

	function limpar() {
		setClienteSelecionado(null);
		setItens([novoItemVazio()]);
		setData(hojeISO());
		setObservacoes("");
		setErroCliente("");
		setErroData("");
		setErroItensGeral("");
		setErrosItens({});
	}

	function handleClose() {
		limpar();
		onClose();
	}

	function addItem() {
		setItens((prev) => [...prev, novoItemVazio()]);
	}

	function removeItem(id: string) {
		setItens((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
	}

	function updateItem(id: string, campo: keyof Omit<ItemForm, "id">, valor: string) {
		setItens((prev) => prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)));
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const novosErrosItens: Record<string, ErrosItem> = {};
		itens.forEach((it) => {
			const errs: ErrosItem = {};
			if (!it.descricao.trim()) errs.descricao = "Obrigatório.";
			if (parseNum(it.quantidade) <= 0) errs.quantidade = "Inválido.";
			if (parseNum(it.valorUnitario) <= 0) errs.valorUnitario = "Inválido.";
			if (Object.keys(errs).length > 0) novosErrosItens[it.id] = errs;
		});

		const novoErroCliente = clienteSelecionado ? "" : "Selecione ou cadastre um cliente.";
		const novoErroData = data ? "" : "Informe a data.";
		const novoErroItensGeral = itens.length === 0 ? "Adicione ao menos um item." : "";

		setErrosItens(novosErrosItens);
		setErroCliente(novoErroCliente);
		setErroData(novoErroData);
		setErroItensGeral(novoErroItensGeral);

		if (
			novoErroCliente ||
			novoErroData ||
			novoErroItensGeral ||
			Object.keys(novosErrosItens).length > 0
		) {
			return;
		}

		onSave({
			id: crypto.randomUUID(),
			cliente: clienteSelecionado!.nome,
			clienteId: clienteSelecionado!.id,
			itens: itens.map((it) => ({
				id: it.id,
				descricao: it.descricao.trim(),
				quantidade: parseNum(it.quantidade),
				valorUnitario: parseNum(it.valorUnitario),
			})),
			data,
			status: "orcamento",
			observacoes: observacoes.trim() || undefined,
		});

		limpar();
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Nova venda">
			<form onSubmit={handleSubmit} className="space-y-4">
				<ClienteSelect value={clienteSelecionado} onChange={setClienteSelecionado} error={erroCliente} />

				<div>
					<div className="mb-2 flex items-center justify-between">
						<label className="text-sm font-medium text-slate-700">Itens</label>
						<button
							type="button"
							onClick={addItem}
							className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
						>
							<Plus size={12} />
							Adicionar item
						</button>
					</div>

					<div className="space-y-2">
						{itens.map((item, idx) => {
							const errs = errosItens[item.id] ?? {};
							const subtotal = parseNum(item.quantidade) * parseNum(item.valorUnitario);
							return (
								<div key={item.id} className="space-y-1.5 rounded-xl border border-slate-200 p-3">
									<div className="flex items-center gap-2">
										<input
											type="text"
											placeholder="Descrição (ex: Bancada granito preto)"
											value={item.descricao}
											onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
											className={`${ITEM_INPUT} ${errs.descricao ? "border-red-400" : ""}`}
										/>
										{itens.length > 1 && (
											<button
												type="button"
												onClick={() => removeItem(item.id)}
												className="shrink-0 text-slate-400 transition hover:text-red-500"
											>
												<X size={15} />
											</button>
										)}
									</div>
									<div className="grid grid-cols-3 gap-2">
										<input
											type="number"
											min="0"
											step="0.01"
											placeholder="Qtd"
											value={item.quantidade}
											onChange={(e) => updateItem(item.id, "quantidade", e.target.value)}
											className={`${ITEM_INPUT} ${errs.quantidade ? "border-red-400" : ""}`}
										/>
										<input
											type="number"
											min="0"
											step="0.01"
											placeholder="Valor unit."
											value={item.valorUnitario}
											onChange={(e) => updateItem(item.id, "valorUnitario", e.target.value)}
											className={`${ITEM_INPUT} ${errs.valorUnitario ? "border-red-400" : ""}`}
										/>
										<div className="flex items-center justify-end text-sm font-medium text-slate-600">
											{formatBRL(subtotal)}
										</div>
									</div>
									{(errs.descricao || errs.quantidade || errs.valorUnitario) && (
										<p className="text-xs text-red-500">
											Preencha a descrição, quantidade e valor unitário do item {idx + 1}.
										</p>
									)}
								</div>
							);
						})}
					</div>
					{erroItensGeral && <p className="mt-1 text-xs text-red-500">{erroItensGeral}</p>}

					<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
						<span className="text-sm font-medium text-slate-500">Total</span>
						<span className="text-lg font-bold text-slate-900">{formatBRL(total)}</span>
					</div>
				</div>

				<Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} error={erroData} />

				<Textarea
					label="Observações"
					placeholder="Detalhes adicionais (opcional)"
					rows={3}
					value={observacoes}
					onChange={(e) => setObservacoes(e.target.value)}
				/>

				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="secondary" className="!w-auto px-5" onClick={handleClose}>
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

// ─── Modal de detalhe da venda ────────────────────────────────────────────────

function DetalheVendaModal({
	venda,
	onClose,
	onAvancarStatus,
	onDeletar,
}: {
	venda: Venda | null;
	onClose: () => void;
	onAvancarStatus: (venda: Venda) => void;
	onDeletar: (venda: Venda) => void;
}) {
	const [confirmando, setConfirmando] = useState(false);
	const navigate = useNavigate();

	if (!venda) return null;

	const total = totalVenda(venda);
	const proxima = proximoStatus(venda.status);
	const labelProxima = PROXIMA_ETAPA_LABEL[venda.status];

	function confirmarDelete() {
		onDeletar(venda!);
		setConfirmando(false);
		onClose();
	}

	function verCliente() {
		const params = venda!.clienteId
			? `clienteId=${encodeURIComponent(venda!.clienteId)}`
			: `nome=${encodeURIComponent(venda!.cliente)}`;
		navigate(`/clientes?${params}`);
	}

	return (
		<Modal isOpen={true} onClose={onClose} title="Venda">
			<div className={`mb-5 rounded-xl p-4 ${STATUS_CONFIG[venda.status].badgeClass.split(" ")[0]}`}>
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={verCliente}
						className="flex items-center gap-2 text-slate-700 transition hover:text-blue-700 hover:underline"
					>
						<ShoppingCart size={14} />
						<span className="text-xs font-semibold">{venda.cliente}</span>
						<ChevronRight size={12} className="shrink-0" />
					</button>
					<StatusBadge status={venda.status} />
				</div>
				<p className="mt-2 text-xl font-bold text-slate-900">{formatBRL(total)}</p>
				<p className="mt-1 text-xs text-slate-500">Pedido em {isoParaDDMMAAAA(venda.data)}</p>
			</div>

			<div className="space-y-2">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Itens</p>
				{venda.itens.map((item) => (
					<div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
						<div className="min-w-0">
							<p className="truncate font-medium text-slate-800">{item.descricao}</p>
							<p className="text-xs text-slate-400">
								{item.quantidade.toLocaleString("pt-BR")} × {formatBRL(item.valorUnitario)}
							</p>
						</div>
						<span className="shrink-0 font-semibold text-slate-800">
							{formatBRL(item.quantidade * item.valorUnitario)}
						</span>
					</div>
				))}
			</div>

			{venda.observacoes && (
				<div className="mt-4">
					<p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Observações</p>
					<p className="text-sm text-slate-700">{venda.observacoes}</p>
				</div>
			)}

			{venda.transacaoId && (
				<p className="mt-4 flex items-center gap-1.5 text-xs text-teal-600">
					<Wallet size={12} />
					Receita lançada no Financeiro para este pedido.
				</p>
			)}

			<div className="mt-6 space-y-3">
				{proxima && labelProxima && (
					<button
						type="button"
						onClick={() => onAvancarStatus(venda)}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
					>
						{labelProxima}
						<ArrowRight size={14} />
					</button>
				)}

				{!confirmando ? (
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={() => setConfirmando(true)}
							className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
						>
							<Trash2 size={14} />
							Cancelar venda
						</button>
						<Button variant="secondary" className="!w-auto px-5" onClick={onClose}>
							Fechar
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						<p className="text-sm text-slate-600">
							Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita
							{venda.transacaoId ? " e também removerá a receita lançada no Financeiro." : "."}
						</p>
						<div className="flex justify-end gap-3">
							<Button variant="secondary" className="!w-auto px-4" onClick={() => setConfirmando(false)}>
								Voltar
							</Button>
							<button
								type="button"
								onClick={confirmarDelete}
								className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
							>
								Confirmar cancelamento
							</button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Vendas() {
	const { addTransacao, deletarTransacao } = useFinanceiro();
	const [vendas, setVendas] = useState<Venda[]>(MOCK_VENDAS);
	const [modalNovaAberto, setModalNovaAberto] = useState(false);
	const [vendaSelecionadaId, setVendaSelecionadaId] = useState<string | null>(null);

	const vendaSelecionada = vendaSelecionadaId
		? (vendas.find((v) => v.id === vendaSelecionadaId) ?? null)
		: null;

	function handleNovaVenda(venda: Venda) {
		setVendas((prev) => [...prev, venda]);
		setModalNovaAberto(false);
	}

	function handleAvancarStatus(venda: Venda) {
		const proxima = proximoStatus(venda.status);
		if (!proxima) return;

		let transacaoId = venda.transacaoId;
		if (proxima === "aprovado" && !transacaoId) {
			const transacao = addTransacao({
				descricao: venda.cliente,
				tipo: "receita",
				categoria: "venda",
				valor: totalVenda(venda),
				vencimento: isoParaDDMM(venda.data),
				status: "em_dia",
			});
			transacaoId = transacao.id;
		}

		setVendas((prev) =>
			prev.map((v) => (v.id === venda.id ? { ...v, status: proxima, transacaoId } : v)),
		);
	}

	function handleDeletarVenda(venda: Venda) {
		if (venda.transacaoId) deletarTransacao(venda.transacaoId);
		setVendas((prev) => prev.filter((v) => v.id !== venda.id));
		setVendaSelecionadaId(null);
	}

	const emOrcamento = vendas.filter((v) => v.status === "orcamento");
	const emCarteira = vendas.filter((v) => v.status === "aprovado" || v.status === "producao");
	const entregues = vendas.filter((v) => v.status === "entregue");

	const totalOrcamento = emOrcamento.reduce((s, v) => s + totalVenda(v), 0);
	const totalCarteira = emCarteira.reduce((s, v) => s + totalVenda(v), 0);
	const totalEntregue = entregues.reduce((s, v) => s + totalVenda(v), 0);

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">Vendas</h1>
						<p className="mt-1 text-sm text-slate-500">
							Acompanhe pedidos do orçamento até a entrega.
						</p>
					</div>

					<button
						onClick={() => setModalNovaAberto(true)}
						className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
					>
						<Plus size={14} />
						Nova venda
					</button>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 space-y-5 overflow-auto p-4 sm:p-6">
					{/* Cards de resumo */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-slate-500">
								<Package size={15} />
								<span className="text-sm font-medium">Em orçamento</span>
							</div>
							<p className="text-2xl font-bold text-slate-900">{formatBRL(totalOrcamento, false)}</p>
							<p className="mt-1 text-xs text-slate-400">
								{emOrcamento.length} {emOrcamento.length === 1 ? "pedido" : "pedidos"}
							</p>
						</div>

						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-blue-600">
								<ShoppingCart size={15} />
								<span className="text-sm font-medium">Em carteira</span>
							</div>
							<p className="text-2xl font-bold text-slate-900">{formatBRL(totalCarteira, false)}</p>
							<p className="mt-1 text-xs text-slate-400">
								{emCarteira.length} {emCarteira.length === 1 ? "pedido aprovado" : "pedidos aprovados"}
							</p>
						</div>

						<div className="rounded-2xl bg-blue-600 p-5 shadow-sm">
							<div className="mb-3 flex items-center gap-2 text-blue-200">
								<Wallet size={15} />
								<span className="text-sm font-medium">Entregue</span>
							</div>
							<p className="text-2xl font-bold text-white">{formatBRL(totalEntregue, false)}</p>
							<p className="mt-1 text-xs text-blue-300">
								{entregues.length} {entregues.length === 1 ? "pedido concluído" : "pedidos concluídos"}
							</p>
						</div>
					</div>

					{/* Pipeline (kanban) */}
					<div className="overflow-x-auto pb-2">
						<div className="flex gap-4" style={{ minWidth: "max-content" }}>
							{ORDEM_STATUS.map((status) => {
								const vendasDaColuna = vendas.filter((v) => v.status === status);
								return (
									<div
										key={status}
										className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-slate-50 p-4"
									>
										<div className="mb-4 flex items-center gap-2.5">
											<div className={`h-2 w-2 shrink-0 rounded-full ${STATUS_CONFIG[status].pontoCor}`} />
											<h2 className="flex-1 text-sm font-semibold text-slate-700">
												{STATUS_CONFIG[status].label}
											</h2>
											<span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
												{vendasDaColuna.length}
											</span>
										</div>

										<div className="flex flex-col gap-3">
											{vendasDaColuna.length === 0 ? (
												<p className="py-6 text-center text-xs text-slate-400">Nenhuma venda</p>
											) : (
												vendasDaColuna.map((venda) => (
													<VendaCard
														key={venda.id}
														venda={venda}
														onClick={() => setVendaSelecionadaId(venda.id)}
													/>
												))
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<NovaVendaModal
				isOpen={modalNovaAberto}
				onClose={() => setModalNovaAberto(false)}
				onSave={handleNovaVenda}
			/>

			<DetalheVendaModal
				venda={vendaSelecionada}
				onClose={() => setVendaSelecionadaId(null)}
				onAvancarStatus={handleAvancarStatus}
				onDeletar={handleDeletarVenda}
			/>
		</DashboardLayout>
	);
}
