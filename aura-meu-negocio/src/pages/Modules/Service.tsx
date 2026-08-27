import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";
import { ChevronRight, MessageCircle } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { api, getApiErrorMessage } from "../../services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Atendimento = {
	id: string;
	nome: string;
	clienteId?: string;
	hora: string;
	mensagem: string;
	avatarCor: string;
};

type Coluna = {
	id: string;
	titulo: string;
	pontoCor: string;
	atendimentos: Atendimento[];
};

type ChatApi = {
	id: string;
	numero: string;
	etapa: string | null;
	data_ultima_conversa: string | null;
	ultima_mensagem: string | null;
	cliente_id: string | null;
	cliente_nome: string | null;
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

const CORES_AVATAR_ATENDIMENTO = [
	"bg-cyan-400",
	"bg-violet-400",
	"bg-emerald-400",
	"bg-amber-400",
	"bg-rose-400",
	"bg-blue-400",
	"bg-slate-400",
];

const CORES_COLUNA = [
	"bg-slate-400",
	"bg-blue-500",
	"bg-amber-500",
	"bg-violet-500",
	"bg-emerald-500",
	"bg-red-400",
	"bg-cyan-500",
];

const SEM_ETAPA = "__sem_etapa__";

function formatarHora(iso: string | null): string {
	if (!iso) return "—";
	const data = new Date(iso);
	return isToday(data) ? format(data, "HH:mm") : format(data, "dd/MM");
}

function humanizarEtapa(etapa: string): string {
	return etapa
		.split("_")
		.filter(Boolean)
		.map((p) => p[0].toUpperCase() + p.slice(1))
		.join(" ");
}

// Agrupa os chats reais pela etapa em que estão no fluxo — não há um conjunto
// fixo de etapas definido no banco, então as colunas refletem o que existe.
function montarColunas(chats: ChatApi[]): Coluna[] {
	const porEtapa = new Map<string, Atendimento[]>();

	chats.forEach((chat, index) => {
		const chave = chat.etapa ?? SEM_ETAPA;

		const atendimento: Atendimento = {
			id: chat.id,
			nome: chat.cliente_nome ?? chat.numero,
			clienteId: chat.cliente_id ?? undefined,
			hora: formatarHora(chat.data_ultima_conversa),
			mensagem: chat.ultima_mensagem ?? "",
			avatarCor: CORES_AVATAR_ATENDIMENTO[index % CORES_AVATAR_ATENDIMENTO.length],
		};

		const lista = porEtapa.get(chave) ?? [];
		lista.push(atendimento);
		porEtapa.set(chave, lista);
	});

	return Array.from(porEtapa.entries()).map(([chave, atendimentos], index) => ({
		id: chave,
		titulo: chave === SEM_ETAPA ? "Sem etapa" : humanizarEtapa(chave),
		pontoCor: CORES_COLUNA[index % CORES_COLUNA.length],
		atendimentos,
	}));
}

// ─── Card de atendimento ──────────────────────────────────────────────────────

function AtendimentoCard({ atendimento }: { atendimento: Atendimento }) {
	const navigate = useNavigate();

	function verCliente() {
		const params = atendimento.clienteId
			? `clienteId=${encodeURIComponent(atendimento.clienteId)}`
			: `nome=${encodeURIComponent(atendimento.nome)}`;
		navigate(`/clientes?${params}`);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
			<button
				type="button"
				onClick={verCliente}
				className="group flex w-full items-center gap-3 text-left"
			>
				<div
					className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${atendimento.avatarCor} text-xs font-bold text-white`}
				>
					{iniciais(atendimento.nome)}
				</div>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 group-hover:underline">
					{atendimento.nome}
				</p>
				<ChevronRight size={13} className="shrink-0 text-slate-300 transition group-hover:text-blue-500" />
				<span className="shrink-0 text-xs text-slate-400">{atendimento.hora}</span>
			</button>
			<p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
				{atendimento.mensagem}
			</p>
			<div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
				<MessageCircle size={11} />
				<span>Última mensagem</span>
			</div>
		</div>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Service() {
	const [colunas, setColunas] = useState<Coluna[]>([]);
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		let cancelado = false;

		api
			.get<ChatApi[]>("/chats")
			.then((res) => {
				if (cancelado) return;
				setColunas(montarColunas(res.data));
			})
			.catch((err) => {
				console.error("Falha ao carregar atendimentos:", getApiErrorMessage(err, "Erro desconhecido"));
			})
			.finally(() => {
				if (!cancelado) setCarregando(false);
			});

		return () => {
			cancelado = true;
		};
	}, []);

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
							Atendimento
						</h1>
						<p className="mt-1 text-sm text-slate-500">
							Acompanhe todos os atendimentos em tempo real.
						</p>
					</div>
				</div>

				{/* KANBAN */}
				<div className="flex-1 overflow-x-auto p-4 sm:p-6">
					{carregando ? (
						<p className="py-20 text-center text-sm text-slate-500">Carregando atendimentos…</p>
					) : colunas.length === 0 ? (
						<p className="py-20 text-center text-sm text-slate-500">Nenhum atendimento encontrado.</p>
					) : (
						<div className="flex h-full gap-4" style={{ minWidth: "max-content" }}>
							{colunas.map((coluna) => (
								<div
									key={coluna.id}
									className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-slate-50 p-4"
								>
									{/* Cabeçalho da coluna */}
									<div className="mb-4 flex items-center gap-2.5">
										<div className={`h-2 w-2 shrink-0 rounded-full ${coluna.pontoCor}`} />
										<h2 className="flex-1 text-sm font-semibold text-slate-700">
											{coluna.titulo}
										</h2>
										<span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
											{coluna.atendimentos.length}
										</span>
									</div>

									{/* Cards */}
									<div className="flex flex-col gap-3 overflow-y-auto">
										{coluna.atendimentos.length === 0 ? (
											<p className="py-6 text-center text-xs text-slate-400">
												Nenhum atendimento
											</p>
										) : (
											coluna.atendimentos.map((a) => (
												<AtendimentoCard key={a.id} atendimento={a} />
											))
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
