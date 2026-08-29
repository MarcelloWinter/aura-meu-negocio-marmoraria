import { useState, useRef, useEffect, type CSSProperties } from "react";
import {
	Plus,
	Lock,
	UserRound,
	ChevronDown,
	ChevronRight,
	CalendarDays,
	Clock,
	RefreshCw,
	FileText,
	X,
} from "lucide-react";
import {
	format,
	startOfWeek,
	addDays,
	subDays,
	addWeeks,
	subWeeks,
	addMonths,
	subMonths,
	startOfMonth,
	isSameDay,
	isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../../components/DashboardLayout";
import { NovoAgendamentoModal } from "./NovoAgendamentoModal";
import { FechaHorarioModal } from "./FechaHorarioModal";
import { api, getApiErrorMessage } from "../../services/api";

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type Evento = {
	id: string;
	nome: string;
	clienteId?: string;
	profissional: string;
	profissionalId?: string;
	data: Date;
	hora: number;
	duracao: number;
	color: string;
	observacoes?: string;
	recorrencia?: Recorrencia;
};

export type Recorrencia =
	| "nenhuma"
	| "diaria"
	| "semanal"
	| "quinzenal"
	| "mensal";

export type Bloqueio = {
	id: string;
	data: Date;
	horaInicio: number;
	horaFim: number;
	recorrencia: Recorrencia;
};

export type Profissional = {
	id: string;
	nome: string;
};

export type NovoAgendamentoInput = {
	cliente: { id: string; nome: string };
	profissional: Profissional;
	data: string;
	horaInicio: string;
	horaFim: string;
	recorrencia: Recorrencia;
	observacoes?: string;
};

// ─── Constantes e helpers ─────────────────────────────────────────────────────

type View = "dia" | "semana" | "mes";

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 24 }).map((_, i) => i);
const DIAS_SEMANA_ABREV = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const COR_AVATAR_PROFISSIONAL: Record<string, string> = {
	Júlia: "bg-violet-100 text-violet-700",
	Rafa: "bg-amber-100 text-amber-700",
	Você: "bg-emerald-100 text-emerald-700",
};

function getInitiais(nome: string): string {
	return nome
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function AvatarProfissional({
	nome,
	small = false,
}: {
	nome: string;
	small?: boolean;
}) {
	const cor = COR_AVATAR_PROFISSIONAL[nome] ?? "bg-slate-100 text-slate-600";
	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${cor} ${
				small ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
			}`}
		>
			{getInitiais(nome)}
		</span>
	);
}

const LABEL_RECORRENCIA: Record<Recorrencia, string> = {
	nenhuma: "",
	diaria: "Diário",
	semanal: "Semanal",
	quinzenal: "Quinzenal",
	mensal: "Mensal",
};

function formatHora(hora: number): string {
	const h = Math.floor(hora);
	const m = Math.round((hora % 1) * 60);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function aplicaNoDia(data: Date, recorrencia: Recorrencia | undefined, dia: Date): boolean {
	const diaMs = new Date(
		dia.getFullYear(),
		dia.getMonth(),
		dia.getDate(),
	).getTime();
	const bdMs = new Date(
		data.getFullYear(),
		data.getMonth(),
		data.getDate(),
	).getTime();

	if (diaMs < bdMs) return false;

	switch (recorrencia ?? "nenhuma") {
		case "nenhuma":
			return diaMs === bdMs;
		case "diaria":
			return true;
		case "semanal":
			return dia.getDay() === data.getDay();
		case "quinzenal": {
			const diffDias = Math.round((diaMs - bdMs) / 86_400_000);
			return diffDias % 14 === 0;
		}
		case "mensal":
			return dia.getDate() === data.getDate();
	}
}

function eventoAplicaNoDia(evento: Evento, dia: Date): boolean {
	return aplicaNoDia(evento.data, evento.recorrencia, dia);
}

function bloqueioAplicaNoDia(bloqueio: Bloqueio, dia: Date): boolean {
	return aplicaNoDia(bloqueio.data, bloqueio.recorrencia, dia);
}

// ─── Integração com a API ───────────────────────────────────────────────────────

const COR_EVENTO_PADRAO = "bg-purple-100 border-purple-500";

type AgendamentoApi = {
	id: string;
	cliente_id: string | null;
	cliente_nome: string | null;
	profissional_id: string | null;
	profissional_nome: string | null;
	data: string; // "YYYY-MM-DD"
	hora_inicio: string; // "HH:MM:SS"
	hora_fim: string;
	etapa: string | null;
	pago: boolean;
	observacoes: string | null;
	recorrencia: string | null;
};

type UsuarioApi = {
	id: string;
	nome: string;
};

function horaParaFracao(hora: string): number {
	const [h, m] = hora.split(":").map(Number);
	return h + m / 60;
}

function mapAgendamentoApi(row: AgendamentoApi): Evento {
	return {
		id: row.id,
		nome: row.cliente_nome ?? "Cliente",
		clienteId: row.cliente_id ?? undefined,
		profissional: row.profissional_nome ?? "—",
		profissionalId: row.profissional_id ?? undefined,
		data: new Date(`${row.data}T00:00:00`),
		hora: horaParaFracao(row.hora_inicio),
		duracao: horaParaFracao(row.hora_fim) - horaParaFracao(row.hora_inicio),
		color: COR_EVENTO_PADRAO,
		observacoes: row.observacoes ?? undefined,
		recorrencia: (row.recorrencia as Recorrencia | null) ?? "nenhuma",
	};
}

// ─── Componentes de renderização ──────────────────────────────────────────────

type EventLayout = {
	evento: Evento;
	col: number;
	totalCols: number;
};

function calcularLayout(eventos: Evento[]): EventLayout[] {
	if (eventos.length === 0) return [];

	const sorted = [...eventos].sort((a, b) =>
		a.hora !== b.hora ? a.hora - b.hora : b.duracao - a.duracao,
	);

	const colEndTimes: number[] = [];
	const assignments: Array<{ evento: Evento; col: number }> = [];

	for (const evento of sorted) {
		const eventoEnd = evento.hora + evento.duracao;
		let col = colEndTimes.findIndex((t) => t <= evento.hora);
		if (col === -1) col = colEndTimes.length;
		colEndTimes[col] = eventoEnd;
		assignments.push({ evento, col });
	}

	return assignments.map(({ evento, col }) => {
		const eventoEnd = evento.hora + evento.duracao;
		const overlapping = assignments.filter(({ evento: other }) => {
			const otherEnd = other.hora + other.duracao;
			return other.hora < eventoEnd && otherEnd > evento.hora;
		});
		const totalCols = Math.max(...overlapping.map((o) => o.col)) + 1;
		return { evento, col, totalCols };
	});
}

function EventoCard({
	evento,
	layoutStyle,
	onClick,
}: {
	evento: Evento;
	layoutStyle: CSSProperties;
	onClick: () => void;
}) {
	const altura = evento.duracao * HOUR_HEIGHT;
	// Altura mínima para que o nome sempre caiba sem corte (texto ~15px + py-1 = 4px × 2)
	const alturaDisplay = Math.max(altura, 28);
	const compact = alturaDisplay < 40;

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => e.key === "Enter" && onClick()}
			className={`absolute ${evento.color} z-10 cursor-pointer overflow-hidden rounded-xl border-l-4 text-xs shadow-sm transition-opacity hover:opacity-80 ${compact ? "px-2 py-1" : "p-2"}`}
			style={{
				top: evento.hora * HOUR_HEIGHT,
				height: alturaDisplay,
				...layoutStyle,
			}}
		>
			<p className="truncate font-semibold leading-tight text-slate-800">
				{evento.nome}
			</p>
			{!compact && (
				<p className="truncate leading-tight text-slate-600">{evento.profissional}</p>
			)}
		</div>
	);
}

function BloqueioBlock({ bloqueio }: { bloqueio: Bloqueio }) {
	const altura = (bloqueio.horaFim - bloqueio.horaInicio) * HOUR_HEIGHT;
	const label = LABEL_RECORRENCIA[bloqueio.recorrencia];

	return (
		<div
			className="absolute left-0 right-0 z-0 overflow-hidden border-l-4 border-slate-400 bg-slate-100/90"
			style={{
				top: bloqueio.horaInicio * HOUR_HEIGHT,
				height: altura,
				backgroundImage:
					"repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(148,163,184,0.18) 5px, rgba(148,163,184,0.18) 10px)",
			}}
		>
			{altura >= 24 && (
				<div className="flex items-center gap-1 p-1.5">
					<Lock size={9} className="shrink-0 text-slate-400" />
					<p className="text-[10px] font-medium text-slate-500">
						Fechado{label ? ` · ${label}` : ""}
					</p>
				</div>
			)}
		</div>
	);
}

function HourColumn() {
	return (
		<div className="bg-white">
			{HOURS.map((h) => (
				<div
					key={h}
					className="h-16 text-[10px] text-slate-400 text-right pr-1 pt-1"
				>
					{h}:00
				</div>
			))}
		</div>
	);
}

function DayColumn({
	dia,
	eventos,
	bloqueios,
	onEventoClick,
}: {
	dia: Date;
	eventos: Evento[];
	bloqueios: Bloqueio[];
	onEventoClick: (evento: Evento) => void;
}) {
	const bloqueiosDoDia = bloqueios.filter((b) => bloqueioAplicaNoDia(b, dia));

	return (
		<div className="relative border-l border-slate-200">
			{HOURS.map((h) => (
				<div
					key={h}
					className="h-16 border-b border-slate-100 hover:bg-slate-50 transition"
				/>
			))}

			{/* Bloqueios atrás dos eventos */}
			{bloqueiosDoDia.map((b) => (
				<BloqueioBlock key={b.id} bloqueio={b} />
			))}

			{/* Eventos à frente dos bloqueios — com layout de colunas para sobreposições */}
			{calcularLayout(eventos.filter((e) => eventoAplicaNoDia(e, dia))).map(
				({ evento, col, totalCols }) => (
					<EventoCard
						key={evento.id}
						evento={evento}
						layoutStyle={{
							left: `calc(${(col / totalCols) * 100}% + 4px)`,
							width: `calc(${(1 / totalCols) * 100}% - 8px)`,
						}}
						onClick={() => onEventoClick(evento)}
					/>
				),
			)}
		</div>
	);
}

function DayHeader({ dia }: { dia: Date }) {
	const isToday = isSameDay(dia, new Date());
	return (
		<div className={`text-center py-3 ${isToday ? "bg-blue-50" : ""}`}>
			<p className="text-xs text-slate-500 font-medium">
				{format(dia, "EEE", { locale: ptBR }).toUpperCase().slice(0, 3)}
			</p>
			<p className="text-lg font-semibold text-slate-800">
				{format(dia, "dd")}
			</p>
		</div>
	);
}

// ─── Views ────────────────────────────────────────────────────────────────────

function AgendaDiaView({
	date,
	eventos,
	bloqueios,
	onEventoClick,
}: {
	date: Date;
	eventos: Evento[];
	bloqueios: Bloqueio[];
	onEventoClick: (evento: Evento) => void;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white">
			<div className="sticky top-0 z-20 grid grid-cols-[50px_1fr] rounded-t-2xl border-b border-slate-200 bg-white">
				<div />
				<DayHeader dia={date} />
			</div>
			<div className="grid grid-cols-[50px_1fr]">
				<HourColumn />
				<DayColumn dia={date} eventos={eventos} bloqueios={bloqueios} onEventoClick={onEventoClick} />
			</div>
		</div>
	);
}

function AgendaSemanaView({
	date,
	eventos,
	bloqueios,
	onEventoClick,
}: {
	date: Date;
	eventos: Evento[];
	bloqueios: Bloqueio[];
	onEventoClick: (evento: Evento) => void;
}) {
	const startWeek = startOfWeek(date, { weekStartsOn: 1 });
	const dias = Array.from({ length: 7 }).map((_, i) => addDays(startWeek, i));

	return (
		<div className="min-w-[900px] rounded-2xl border border-slate-200 bg-white">
			<div className="sticky top-0 z-20 grid grid-cols-8 rounded-t-2xl border-b border-slate-200 bg-white">
				<div className="w-[50px]" />
				{dias.map((dia, i) => (
					<DayHeader key={i} dia={dia} />
				))}
			</div>
			<div className="grid grid-cols-8">
				<div className="w-[50px] pr-1">
					<HourColumn />
				</div>
				{dias.map((dia, i) => (
					<DayColumn key={i} dia={dia} eventos={eventos} bloqueios={bloqueios} onEventoClick={onEventoClick} />
				))}
			</div>
		</div>
	);
}

function AgendaMesView({
	date,
	eventos,
	bloqueios,
	onEventoClick,
}: {
	date: Date;
	eventos: Evento[];
	bloqueios: Bloqueio[];
	onEventoClick: (evento: Evento) => void;
}) {
	const monthStart = startOfMonth(date);
	const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

	const cells = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));
	const weeks = Array.from({ length: 6 }).map((_, i) =>
		cells.slice(i * 7, i * 7 + 7),
	);
	const visibleWeeks = weeks.filter((week) =>
		week.some((d) => isSameMonth(d, date)),
	);

	const today = new Date();

	return (
		<div className="rounded-2xl border border-slate-200 bg-white">
			<div className="sticky top-0 z-20 grid grid-cols-7 rounded-t-2xl border-b border-slate-200 bg-white">
				{DIAS_SEMANA_ABREV.map((dia) => (
					<div
						key={dia}
						className="py-3 text-center text-xs font-medium text-slate-500"
					>
						{dia}
					</div>
				))}
			</div>

			{visibleWeeks.map((semana, si) => (
				<div key={si} className="grid grid-cols-7">
					{semana.map((dia, di) => {
						const isCurrentMonth = isSameMonth(dia, date);
						const isToday = isSameDay(dia, today);
						const isLastWeek = si === visibleWeeks.length - 1;

						const eventosDoDia = eventos
							.filter((e) => eventoAplicaNoDia(e, dia))
							.sort((a, b) => a.hora - b.hora);

						const bloqueiosDoDia = bloqueios.filter((b) =>
							bloqueioAplicaNoDia(b, dia),
						);

						const totalItens = bloqueiosDoDia.length + eventosDoDia.length;
						const maxVisiveis = 3;

						return (
							<div
								key={di}
								className={`
									min-h-[100px] p-2 border-r border-slate-100
									${!isLastWeek ? "border-b" : ""}
									${!isCurrentMonth ? "bg-slate-50/60" : ""}
								`}
							>
								<div className="mb-1">
									{isToday ? (
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
											{format(dia, "d")}
										</span>
									) : (
										<span
											className={`text-sm font-medium ${
												isCurrentMonth ? "text-slate-800" : "text-slate-300"
											}`}
										>
											{format(dia, "d")}
										</span>
									)}
								</div>

								<div className="space-y-0.5">
									{/* Bloqueios */}
									{bloqueiosDoDia.slice(0, maxVisiveis).map((b) => (
										<div
											key={b.id}
											className="flex items-center gap-1 rounded border-l-2 border-slate-400 bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500"
										>
											<Lock size={8} className="shrink-0" />
											<span className="truncate">
												{formatHora(b.horaInicio)}–{formatHora(b.horaFim)}
											</span>
										</div>
									))}

									{/* Eventos (completando até maxVisiveis) */}
									{eventosDoDia
										.slice(0, Math.max(0, maxVisiveis - bloqueiosDoDia.length))
										.map((evento) => (
											<button
												key={evento.id}
												type="button"
												onClick={() => onEventoClick(evento)}
												className={`flex w-full cursor-pointer items-center gap-1 rounded border-l-2 px-1.5 py-0.5 text-left text-xs transition-opacity hover:opacity-75 ${evento.color}`}
											>
												<span className="shrink-0 text-slate-500">
													{formatHora(evento.hora)}
												</span>
												<span className="truncate font-medium text-slate-700">
													{evento.nome}
												</span>
											</button>
										))}

									{totalItens > maxVisiveis && (
										<p className="px-1.5 text-xs text-slate-400">
											+{totalItens - maxVisiveis} mais
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}

// ─── Modal de detalhes do evento ─────────────────────────────────────────────

function DetalheEventoModal({
	evento,
	onClose,
	onCancelar,
}: {
	evento: Evento | null;
	onClose: () => void;
	onCancelar: (id: string) => void;
}) {
	const [confirmando, setConfirmando] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		setConfirmando(false);
	}, [evento]);

	if (!evento) return null;

	function verCliente() {
		const params = evento!.clienteId
			? `clienteId=${encodeURIComponent(evento!.clienteId)}`
			: `nome=${encodeURIComponent(evento!.nome)}`;
		navigate(`/clientes?${params}`);
	}

	const horaInicio = formatHora(evento.hora);
	const horaFim = formatHora(evento.hora + evento.duracao);
	const dataFormatada = format(
		evento.data,
		"EEEE, dd 'de' MMMM 'de' yyyy",
		{ locale: ptBR },
	);
	const labelRecorrencia =
		evento.recorrencia && evento.recorrencia !== "nenhuma"
			? LABEL_RECORRENCIA[evento.recorrencia]
			: null;

	return (
		<div
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-sm rounded-2xl bg-white shadow-lg"
			>
				{/* Cabeçalho colorido com o profissional */}
				<div className={`flex items-center justify-between rounded-t-2xl border-l-4 px-5 py-4 ${evento.color}`}>
					<div>
						<p className="text-xs font-medium text-slate-500">Profissional</p>
						<p className="text-base font-semibold text-slate-800">
							{evento.profissional}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 transition hover:text-slate-600"
					>
						<X size={18} />
					</button>
				</div>

				{/* Campos */}
				<div className="space-y-3 px-5 py-5">
					<button
						type="button"
						onClick={verCliente}
						className="group flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-slate-50"
					>
						<UserRound size={15} className="shrink-0 text-slate-400" />
						<div className="min-w-0 flex-1">
							<p className="text-[11px] text-slate-400">Cliente</p>
							<p className="truncate text-sm font-medium text-blue-600 group-hover:underline">
								{evento.nome}
							</p>
						</div>
						<ChevronRight size={14} className="shrink-0 text-slate-300" />
					</button>

					<div className="flex items-center gap-3">
						<CalendarDays size={15} className="shrink-0 text-slate-400" />
						<div>
							<p className="text-[11px] text-slate-400">Data</p>
							<p className="text-sm font-medium capitalize text-slate-800">
								{dataFormatada}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Clock size={15} className="shrink-0 text-slate-400" />
						<div>
							<p className="text-[11px] text-slate-400">Horário</p>
							<p className="text-sm font-medium text-slate-800">
								{horaInicio} – {horaFim}
							</p>
						</div>
					</div>

					{labelRecorrencia && (
						<div className="flex items-center gap-3">
							<RefreshCw size={15} className="shrink-0 text-slate-400" />
							<div>
								<p className="text-[11px] text-slate-400">Repete</p>
								<p className="text-sm font-medium text-slate-800">
									{labelRecorrencia}
								</p>
							</div>
						</div>
					)}

					{evento.observacoes && (
						<div className="flex items-start gap-3">
							<FileText size={15} className="mt-0.5 shrink-0 text-slate-400" />
							<div>
								<p className="text-[11px] text-slate-400">Observações</p>
								<p className="text-sm text-slate-700">{evento.observacoes}</p>
							</div>
						</div>
					)}
				</div>

				<div className="border-t border-slate-100 px-5 pb-5 pt-3">
					{confirmando ? (
						<div className="flex flex-col gap-3">
							<p className="text-sm text-slate-600">
								Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
							</p>
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setConfirmando(false)}
									className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
								>
									Voltar
								</button>
								<button
									type="button"
									onClick={() => {
										onCancelar(evento.id);
										onClose();
									}}
									className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
								>
									Sim, cancelar
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={() => setConfirmando(true)}
								className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
							>
								Cancelar agendamento
							</button>
							<button
								type="button"
								onClick={onClose}
								className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
							>
								Fechar
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Filtro de profissional ───────────────────────────────────────────────────

function FiltroProfissional({
	value,
	onChange,
	profissionais,
}: {
	value: string;
	onChange: (v: string) => void;
	profissionais: string[];
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
			>
				{value ? (
					<AvatarProfissional nome={value} small />
				) : (
					<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
						<UserRound size={11} className="text-slate-500" />
					</span>
				)}
				<span>{value || "Todos"}</span>
				<ChevronDown
					size={13}
					className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg">
					<button
						type="button"
						onClick={() => {
							onChange("");
							setOpen(false);
						}}
						className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
							!value
								? "bg-blue-50 font-medium text-[var(--primary)]"
								: "text-[var(--text)]"
						}`}
					>
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
							<UserRound size={12} className="text-slate-500" />
						</span>
						Todos
					</button>

					{profissionais.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => {
								onChange(p);
								setOpen(false);
							}}
							className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
								value === p
									? "bg-blue-50 font-medium text-[var(--primary)]"
									: "text-[var(--text)]"
							}`}
						>
							<AvatarProfissional nome={p} />
							{p}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

const VIEW_LABELS: Record<View, string> = {
	dia: "Dia",
	semana: "Semana",
	mes: "Mês",
};

export function Agenda() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<View>("semana");
	const [eventos, setEventos] = useState<Evento[]>([]);
	const [carregandoEventos, setCarregandoEventos] = useState(true);
	const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);

	useEffect(() => {
		let cancelado = false;

		api
			.get<AgendamentoApi[]>("/agendamentos")
			.then((res) => {
				if (cancelado) return;
				setEventos(res.data.map(mapAgendamentoApi));
			})
			.catch((err) => {
				console.error("Falha ao carregar agendamentos:", getApiErrorMessage(err, "Erro desconhecido"));
			})
			.finally(() => {
				if (!cancelado) setCarregandoEventos(false);
			});

		return () => {
			cancelado = true;
		};
	}, []);

	const [profissionais, setProfissionais] = useState<Profissional[]>([]);

	useEffect(() => {
		let cancelado = false;

		api
			.get<UsuarioApi[]>("/usuarios")
			.then((res) => {
				if (cancelado) return;
				setProfissionais(res.data);
			})
			.catch((err) => {
				console.error("Falha ao carregar profissionais:", getApiErrorMessage(err, "Erro desconhecido"));
			});

		return () => {
			cancelado = true;
		};
	}, []);

	const [filtroProfissional, setFiltroProfissional] = useState("");
	const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
	const [isBloqueioOpen, setIsBloqueioOpen] = useState(false);
	const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);

	async function salvarAgendamento(dados: NovoAgendamentoInput) {
		const res = await api.post<AgendamentoApi>("/agendamentos", {
			clienteId: dados.cliente.id,
			profissionalId: dados.profissional.id,
			data: dados.data,
			horaInicio: dados.horaInicio,
			horaFim: dados.horaFim,
			observacoes: dados.observacoes,
			recorrencia: dados.recorrencia,
		});

		const novoEvento: Evento = {
			...mapAgendamentoApi(res.data),
			nome: dados.cliente.nome,
			profissional: dados.profissional.nome,
		};

		setEventos((prev) => [...prev, novoEvento]);
		setIsAgendamentoOpen(false);
	}

	function cancelarAgendamento(id: string) {
		setEventos((prev) => prev.filter((e) => e.id !== id));

		api.delete(`/agendamentos/${id}`).catch((err) => {
			console.error("Falha ao cancelar agendamento:", getApiErrorMessage(err, "Erro desconhecido"));
		});
	}

	const eventosFiltrados = filtroProfissional
		? eventos.filter((e) => e.profissional === filtroProfissional)
		: eventos;

	function navigatePrev() {
		if (view === "dia") setCurrentDate((d) => subDays(d, 1));
		else if (view === "semana") setCurrentDate((d) => subWeeks(d, 1));
		else setCurrentDate((d) => subMonths(d, 1));
	}

	function navigateNext() {
		if (view === "dia") setCurrentDate((d) => addDays(d, 1));
		else if (view === "semana") setCurrentDate((d) => addWeeks(d, 1));
		else setCurrentDate((d) => addMonths(d, 1));
	}

	function getSubtitle() {
		if (view === "dia") {
			return format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR });
		}
		return format(currentDate, "MMMM yyyy", { locale: ptBR });
	}

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
							Agenda
						</h1>
						<p className="mt-1 text-sm capitalize text-slate-500">
							{getSubtitle()}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Navegação */}
						<button
							onClick={navigatePrev}
							className="rounded-lg bg-slate-100 px-2 py-1.5 text-sm transition hover:bg-slate-200 sm:px-3 sm:py-2"
						>
							←
						</button>

						<button
							onClick={() => setCurrentDate(new Date())}
							className="rounded-lg bg-slate-100 px-2 py-1.5 text-sm transition hover:bg-slate-200 sm:px-3 sm:py-2"
						>
							Hoje
						</button>

						<button
							onClick={navigateNext}
							className="rounded-lg bg-slate-100 px-2 py-1.5 text-sm transition hover:bg-slate-200 sm:px-3 sm:py-2"
						>
							→
						</button>

						{/* Toggle de visualização */}
						<div className="flex rounded-lg bg-slate-100 p-1">
							{(Object.keys(VIEW_LABELS) as View[]).map((v) => (
								<button
									key={v}
									onClick={() => setView(v)}
									className={`rounded-md px-3 py-1.5 text-sm transition-all ${
										view === v
											? "bg-white font-medium text-slate-900 shadow-sm"
											: "text-slate-500 hover:text-slate-700"
									}`}
								>
									{VIEW_LABELS[v]}
								</button>
							))}
						</div>

						{/* Filtro por profissional */}
						<FiltroProfissional
							value={filtroProfissional}
							onChange={setFiltroProfissional}
							profissionais={profissionais.map((p) => p.nome)}
						/>

						{/* Fechar horário */}
						<button
							onClick={() => setIsBloqueioOpen(true)}
							className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 sm:px-4"
						>
							<Lock size={14} />
							<span className="hidden sm:inline">Fechar horário</span>
						</button>

						{/* Novo agendamento */}
						<button
							onClick={() => setIsAgendamentoOpen(true)}
							className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700 sm:px-4"
						>
							<Plus size={14} />
							<span className="hidden sm:inline">Novo agendamento</span>
						</button>
					</div>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6">
					{carregandoEventos && (
						<p className="py-2 text-center text-sm text-slate-400">Carregando agendamentos…</p>
					)}
					{view === "dia" && (
						<AgendaDiaView
							date={currentDate}
							eventos={eventosFiltrados}
							bloqueios={bloqueios}
							onEventoClick={setEventoSelecionado}
						/>
					)}
					{view === "semana" && (
						<AgendaSemanaView
							date={currentDate}
							eventos={eventosFiltrados}
							bloqueios={bloqueios}
							onEventoClick={setEventoSelecionado}
						/>
					)}
					{view === "mes" && (
						<AgendaMesView
							date={currentDate}
							eventos={eventosFiltrados}
							bloqueios={bloqueios}
							onEventoClick={setEventoSelecionado}
						/>
					)}
				</div>
			</div>

			<NovoAgendamentoModal
				isOpen={isAgendamentoOpen}
				onClose={() => setIsAgendamentoOpen(false)}
				onSave={salvarAgendamento}
				profissionais={profissionais}
			/>

			<DetalheEventoModal
				evento={eventoSelecionado}
				onClose={() => setEventoSelecionado(null)}
				onCancelar={cancelarAgendamento}
			/>

			<FechaHorarioModal
				isOpen={isBloqueioOpen}
				onClose={() => setIsBloqueioOpen(false)}
				onSave={(dados) => {
					setBloqueios((prev) => [
						...prev,
						{ id: crypto.randomUUID(), ...dados },
					]);
					setIsBloqueioOpen(false);
				}}
			/>
		</DashboardLayout>
	);
}
