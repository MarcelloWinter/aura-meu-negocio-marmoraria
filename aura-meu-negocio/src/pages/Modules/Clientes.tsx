import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Phone, Trash2, CalendarDays } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { Modal } from "../../ui/Modal";
import { Button } from "../../components/Button";
import { NovoClienteModal } from "../../components/NovoClienteModal";
import { useClientes } from "../../contexts/ClientesContext";
import type { Cliente, StatusAgendamento } from "../../contexts/ClientesContext";

// ─── Configuração de status ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusAgendamento, { label: string; className: string }> = {
	concluido: { label: "Concluído", className: "bg-emerald-100 text-emerald-700" },
	cancelado: { label: "Cancelado", className: "bg-red-100 text-red-600" },
	pendente: { label: "Pendente", className: "bg-blue-100 text-blue-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string): string {
	return nome
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join("");
}

function formatarEndereco(endereco: NonNullable<Cliente["endereco"]>): string {
	const linha1 = [
		endereco.rua,
		endereco.numero,
		endereco.complemento,
	].filter(Boolean).join(", ");
	const linha2 = [
		endereco.bairro,
		[endereco.cidade, endereco.estado].filter(Boolean).join(" - "),
		endereco.cep,
	].filter(Boolean).join(", ");
	return [linha1, linha2].filter(Boolean).join(" · ");
}

// ─── Card de cliente ──────────────────────────────────────────────────────────

function ClienteCard({ cliente, onClick }: { cliente: Cliente; onClick: () => void }) {
	const total = cliente.agendamentos.length;

	return (
		<div
			onClick={onClick}
			className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
		>
			<div className="flex items-center gap-4">
				<div
					className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cliente.avatarCor} text-sm font-bold text-white`}
				>
					{iniciais(cliente.nome)}
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold text-slate-900">{cliente.nome}</p>
					<div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
						<Phone size={11} />
						<span>{cliente.telefone}</span>
					</div>
				</div>
				<div className="shrink-0 text-right">
					<p className="text-xl font-bold text-slate-900">{total}</p>
					<p className="text-[11px] text-slate-400">
						{total === 1 ? "agendamento" : "agendamentos"}
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Modal de detalhe do cliente ──────────────────────────────────────────────

function DetalheClienteModal({
	cliente,
	onClose,
	onDeletar,
}: {
	cliente: Cliente | null;
	onClose: () => void;
	onDeletar: (id: string) => void;
}) {
	const [confirmando, setConfirmando] = useState(false);
	useEffect(() => { setConfirmando(false); }, [cliente?.id]);

	if (!cliente) return null;

	function confirmarDelete() {
		onDeletar(cliente!.id);
		onClose();
	}

	return (
		<Modal isOpen={true} onClose={onClose} title="Detalhes do cliente">
			{/* Cabeçalho do cliente */}
			<div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
				<div
					className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cliente.avatarCor} text-sm font-bold text-white`}
				>
					{iniciais(cliente.nome)}
				</div>
				<div>
					<p className="font-bold text-slate-900">{cliente.nome}</p>
					<div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
						<Phone size={12} />
						<span>{cliente.telefone}</span>
					</div>
				</div>
			</div>

			{/* Dados pessoais */}
			<div className="mb-5 space-y-1.5 rounded-xl border border-slate-100 p-4 text-sm">
				<p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
					Dados pessoais
				</p>
				<p className="flex justify-between gap-3">
					<span className="shrink-0 text-slate-400">CPF/CNPJ</span>
					<span className="text-right text-slate-700">{cliente.cpfCnpj || "—"}</span>
				</p>
				<p className="flex justify-between gap-3">
					<span className="shrink-0 text-slate-400">E-mail</span>
					<span className="text-right text-slate-700">{cliente.email || "—"}</span>
				</p>
				<p className="flex justify-between gap-3">
					<span className="shrink-0 text-slate-400">Endereço</span>
					<span className="text-right text-slate-700">
						{cliente.endereco ? formatarEndereco(cliente.endereco) || "—" : "—"}
					</span>
				</p>
			</div>

			{/* Histórico de agendamentos */}
			<div>
				<div className="mb-3 flex items-center gap-2">
					<CalendarDays size={14} className="text-slate-400" />
					<p className="text-sm font-semibold text-slate-700">Histórico de agendamentos</p>
				</div>

				{cliente.agendamentos.length === 0 ? (
					<p className="py-6 text-center text-sm text-slate-400">
						Nenhum agendamento registrado.
					</p>
				) : (
					<div className="max-h-56 space-y-2 overflow-y-auto pr-0.5">
						{cliente.agendamentos.map((ag) => {
							const { label, className } = STATUS_CONFIG[ag.status];
							return (
								<div
									key={ag.id}
									className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-slate-800">
											{ag.servico}
										</p>
										<p className="text-xs text-slate-400">
											{ag.data} · {ag.horario}
										</p>
									</div>
									<span
										className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
									>
										{label}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Rodapé */}
			{!confirmando ? (
				<div className="mt-6 flex items-center justify-between">
					<button
						onClick={() => setConfirmando(true)}
						className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
					>
						<Trash2 size={14} />
						Excluir cliente
					</button>
					<Button variant="secondary" className="!w-auto px-5" onClick={onClose}>
						Fechar
					</Button>
				</div>
			) : (
				<div className="mt-6 space-y-4">
					<p className="text-sm text-slate-600">
						Tem certeza que deseja excluir{" "}
						<strong className="text-slate-800">{cliente.nome}</strong>? Esta ação
						não pode ser desfeita.
					</p>
					<div className="flex justify-end gap-3">
						<Button
							variant="secondary"
							className="!w-auto px-4"
							onClick={() => setConfirmando(false)}
						>
							Voltar
						</Button>
						<button
							onClick={confirmarDelete}
							className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
						>
							Confirmar exclusão
						</button>
					</div>
				</div>
			)}
		</Modal>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Clientes() {
	const { clientes, deletarCliente: deletarClienteCtx } = useClientes();
	const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
	const [modalAberto, setModalAberto] = useState(false);
	const [busca, setBusca] = useState("");
	const [searchParams, setSearchParams] = useSearchParams();

	// Abre o cliente automaticamente ao chegar via link de outra página (Agenda, Financeiro…)
	useEffect(() => {
		const clienteId = searchParams.get("clienteId");
		const nomeBusca = searchParams.get("nome");
		if (!clienteId && !nomeBusca) return;

		const alvo = clienteId
			? clientes.find((c) => c.id === clienteId)
			: clientes.find((c) => c.nome.toLowerCase() === nomeBusca!.toLowerCase());

		if (alvo) setClienteSelecionado(alvo);
		if (nomeBusca && !clienteId) setBusca(nomeBusca);
		setSearchParams({}, { replace: true });
	}, [searchParams, clientes, setSearchParams]);

	const clientesFiltrados = clientes.filter(
		(c) =>
			c.nome.toLowerCase().includes(busca.toLowerCase()) ||
			c.telefone.includes(busca),
	);

	function deletarCliente(id: string) {
		deletarClienteCtx(id);
		setClienteSelecionado(null);
	}

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
							Clientes
						</h1>
						<p className="mt-1 text-sm text-slate-500">
							Gerencie seus clientes e histórico de agendamentos.
						</p>
					</div>
					<button
						onClick={() => setModalAberto(true)}
						className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
					>
						<Plus size={14} />
						Adicionar cliente
					</button>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 overflow-auto p-4 sm:p-6">
					{/* Busca */}
					<div className="relative mb-5">
						<Search
							size={14}
							className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							placeholder="Buscar por nome ou telefone…"
							value={busca}
							onChange={(e) => setBusca(e.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
						/>
					</div>

					{/* Grid ou estado vazio */}
					{clientesFiltrados.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<p className="text-sm text-slate-500">
								{busca
									? "Nenhum cliente encontrado."
									: "Nenhum cliente cadastrado ainda."}
							</p>
							{!busca && (
								<button
									onClick={() => setModalAberto(true)}
									className="mt-3 text-sm font-medium text-blue-600 hover:underline"
								>
									Adicionar o primeiro cliente
								</button>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{clientesFiltrados.map((c) => (
								<ClienteCard
									key={c.id}
									cliente={c}
									onClick={() => setClienteSelecionado(c)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<DetalheClienteModal
				cliente={clienteSelecionado}
				onClose={() => setClienteSelecionado(null)}
				onDeletar={deletarCliente}
			/>

			<NovoClienteModal
				isOpen={modalAberto}
				onClose={() => setModalAberto(false)}
			/>
		</DashboardLayout>
	);
}
