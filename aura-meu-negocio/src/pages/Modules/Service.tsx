import { MessageCircle } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Atendimento = {
	id: string;
	nome: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string): string {
	return nome
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join("");
}

// ─── Dados mockados ───────────────────────────────────────────────────────────

const COLUNAS_INICIAIS: Coluna[] = [
	{
		id: "inicio",
		titulo: "Início",
		pontoCor: "bg-slate-400",
		atendimentos: [
			{
				id: "a1",
				nome: "Lucas Andrade",
				hora: "10:05",
				mensagem: "Olá! Gostaria de saber mais sobre os serviços de vocês.",
				avatarCor: "bg-cyan-400",
			},
			{
				id: "a2",
				nome: "Beatriz Souza",
				hora: "09:40",
				mensagem: "Bom dia! Preciso de um orçamento urgente.",
				avatarCor: "bg-violet-400",
			},
		],
	},
	{
		id: "agendamento",
		titulo: "Agendamento",
		pontoCor: "bg-blue-500",
		atendimentos: [
			{
				id: "a3",
				nome: "Marina Lima",
				hora: "09:55",
				mensagem: "Pode ser às 14h de sexta-feira?",
				avatarCor: "bg-emerald-400",
			},
			{
				id: "a4",
				nome: "Carlos Mendes",
				hora: "10:22",
				mensagem: "Confirmo para amanhã às 10h.",
				avatarCor: "bg-amber-400",
			},
		],
	},
	{
		id: "cancelamento",
		titulo: "Cancelamento",
		pontoCor: "bg-red-400",
		atendimentos: [
			{
				id: "a5",
				nome: "Fernanda S.",
				hora: "Ontem",
				mensagem: "Preciso cancelar, tive um imprevisto.",
				avatarCor: "bg-rose-400",
			},
		],
	},
	{
		id: "pagamento",
		titulo: "Pagamento",
		pontoCor: "bg-amber-500",
		atendimentos: [
			{
				id: "a6",
				nome: "Pedro Lima",
				hora: "08:30",
				mensagem: "Pode me enviar o Pix?",
				avatarCor: "bg-blue-400",
			},
			{
				id: "a7",
				nome: "Rafael N.",
				hora: "Ontem",
				mensagem: "Aguardando o link de pagamento.",
				avatarCor: "bg-slate-400",
			},
		],
	},
	{
		id: "humano",
		titulo: "Atendimento Humano",
		pontoCor: "bg-violet-500",
		atendimentos: [
			{
				id: "a8",
				nome: "Ana Costa",
				hora: "11:45",
				mensagem: "Tenho dúvidas que o bot não conseguiu responder.",
				avatarCor: "bg-cyan-500",
			},
		],
	},
	{
		id: "concluido",
		titulo: "Concluído",
		pontoCor: "bg-emerald-500",
		atendimentos: [
			{
				id: "a9",
				nome: "Júlia M.",
				hora: "Ontem",
				mensagem: "Serviço incrível, voltarei em breve!",
				avatarCor: "bg-emerald-400",
			},
			{
				id: "a10",
				nome: "Roberto K.",
				hora: "Seg",
				mensagem: "Ótimo atendimento, recomendo.",
				avatarCor: "bg-violet-400",
			},
			{
				id: "a11",
				nome: "Patrícia N.",
				hora: "Seg",
				mensagem: "Muito profissional, adorei!",
				avatarCor: "bg-amber-400",
			},
		],
	},
];

// ─── Card de atendimento ──────────────────────────────────────────────────────

function AtendimentoCard({ atendimento }: { atendimento: Atendimento }) {
	return (
		<div className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
			<div className="flex items-center gap-3">
				<div
					className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${atendimento.avatarCor} text-xs font-bold text-white`}
				>
					{iniciais(atendimento.nome)}
				</div>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
					{atendimento.nome}
				</p>
				<span className="shrink-0 text-xs text-slate-400">{atendimento.hora}</span>
			</div>
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
					<div className="flex h-full gap-4" style={{ minWidth: "max-content" }}>
						{COLUNAS_INICIAIS.map((coluna) => (
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
				</div>
			</div>

		</DashboardLayout>
	);
}
