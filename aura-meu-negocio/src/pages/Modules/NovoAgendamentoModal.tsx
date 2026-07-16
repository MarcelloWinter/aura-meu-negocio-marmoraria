import { useState } from "react";

import { Modal } from "../../ui/Modal";
import { Select } from "../../ui/Select";
import type { SelectOption } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { ClienteSelect } from "../../components/ClienteSelect";
import type { Cliente } from "../../contexts/ClientesContext";

import type { Evento, Recorrencia } from "./Agenda";

const SERVICOS: SelectOption[] = [
	{ label: "Corte feminino", value: "Corte feminino" },
	{ label: "Corte masculino", value: "Corte masculino" },
	{ label: "Barba", value: "Barba" },
	{ label: "Avaliação", value: "Avaliação" },
	{ label: "Manicure", value: "Manicure" },
];

const PROFISSIONAIS: SelectOption[] = [
	{ label: "Júlia", value: "Júlia" },
	{ label: "Rafa", value: "Rafa" },
	{ label: "Você", value: "Você" },
];

// Duração padrão de cada serviço em minutos
const DURACAO_POR_SERVICO: Record<string, number> = {
	"Corte feminino": 60,
	"Corte masculino": 45,
	Barba: 30,
	Avaliação: 30,
	Manicure: 60,
};
const DURACAO_PADRAO = 60;

const COR_DOT_POR_SERVICO: Record<string, string> = {
	"Corte feminino": "bg-blue-500",
	"Corte masculino": "bg-indigo-500",
	Barba: "bg-green-500",
	Avaliação: "bg-cyan-500",
	Manicure: "bg-pink-500",
};
const COR_DOT_PADRAO = "bg-purple-500";

const COR_AVATAR_POR_PROFISSIONAL: Record<string, string> = {
	Júlia: "bg-violet-100 text-violet-700",
	Rafa: "bg-amber-100 text-amber-700",
	Você: "bg-emerald-100 text-emerald-700",
};
const COR_AVATAR_PADRAO = "bg-slate-100 text-slate-600";

const CORES_POR_SERVICO: Record<string, string> = {
	"Corte feminino": "bg-blue-100 border-blue-500",
	"Corte masculino": "bg-indigo-100 border-indigo-500",
	Barba: "bg-green-100 border-green-500",
	Avaliação: "bg-cyan-100 border-cyan-500",
	Manicure: "bg-pink-100 border-pink-500",
};
const COR_PADRAO = "bg-purple-100 border-purple-500";

const OPCOES_RECORRENCIA: SelectOption[] = [
	{ label: "Não repete", value: "nenhuma" },
	{ label: "Diariamente", value: "diaria" },
	{ label: "Semanalmente", value: "semanal" },
	{ label: "Quinzenalmente", value: "quinzenal" },
	{ label: "Mensalmente", value: "mensal" },
];

const DESCRICAO_RECORRENCIA: Record<Recorrencia, string> = {
	nenhuma: "",
	diaria: "O agendamento se repete todos os dias a partir desta data.",
	semanal: "O agendamento se repete toda semana neste mesmo dia.",
	quinzenal: "O agendamento se repete a cada duas semanas.",
	mensal: "O agendamento se repete todo mês neste mesmo dia.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function addMinutesToTime(time: string, minutes: number): string {
	const [h, m] = time.split(":").map(Number);
	const total = h * 60 + m + minutes;
	const newH = Math.floor(total / 60) % 24;
	const newM = total % 60;
	return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

function renderServico(option: SelectOption) {
	return (
		<>
			<span
				className={`h-2 w-2 shrink-0 rounded-full ${COR_DOT_POR_SERVICO[option.value] ?? COR_DOT_PADRAO}`}
			/>
			{option.label}
		</>
	);
}

function renderProfissional(option: SelectOption) {
	const cor = COR_AVATAR_POR_PROFISSIONAL[option.value] ?? COR_AVATAR_PADRAO;
	return (
		<>
			<span
				className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${cor}`}
			>
				{getInitials(option.label)}
			</span>
			{option.label}
		</>
	);
}

// ─── Modal de novo agendamento ────────────────────────────────────────────────

const ERROS_VAZIOS = {
	cliente: "",
	servico: "",
	profissional: "",
	data: "",
	horarioInicio: "",
	horarioFim: "",
};

interface NovoAgendamentoModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (evento: Evento) => void;
}

export function NovoAgendamentoModal({
	isOpen,
	onClose,
	onSave,
}: NovoAgendamentoModalProps) {
	const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
	const [servico, setServico] = useState("");
	const [profissional, setProfissional] = useState("");
	const [data, setData] = useState("");
	const [horarioInicio, setHorarioInicio] = useState("");
	const [horarioFim, setHorarioFim] = useState("");
	const [recorrencia, setRecorrencia] = useState<Recorrencia>("nenhuma");
	const [observacoes, setObservacoes] = useState("");

	const [errors, setErrors] = useState(ERROS_VAZIOS);

	function recalcularFim(inicio: string, servicoAtual: string) {
		if (!inicio) return;
		const duracao = DURACAO_POR_SERVICO[servicoAtual] ?? DURACAO_PADRAO;
		setHorarioFim(addMinutesToTime(inicio, duracao));
	}

	function handleServicoChange(value: string) {
		setServico(value);
		recalcularFim(horarioInicio, value);
	}

	function handleHorarioInicioChange(value: string) {
		setHorarioInicio(value);
		recalcularFim(value, servico);
	}

	function limparFormulario() {
		setClienteSelecionado(null);
		setServico("");
		setProfissional("");
		setData("");
		setHorarioInicio("");
		setHorarioFim("");
		setRecorrencia("nenhuma");
		setObservacoes("");
		setErrors(ERROS_VAZIOS);
	}

	function handleClose() {
		limparFormulario();
		onClose();
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const fimDepoisDoInicio =
			horarioFim && horarioInicio
				? timeToMinutes(horarioFim) > timeToMinutes(horarioInicio)
				: true;

		const novosErros = {
			cliente: clienteSelecionado ? "" : "Selecione ou cadastre um cliente.",
			servico: servico ? "" : "Selecione o serviço.",
			profissional: profissional ? "" : "Selecione o profissional.",
			data: data ? "" : "Informe a data.",
			horarioInicio: horarioInicio ? "" : "Informe o início.",
			horarioFim: !horarioFim
				? "Informe o fim."
				: !fimDepoisDoInicio
					? "Fim deve ser após o início."
					: "",
		};

		setErrors(novosErros);

		if (Object.values(novosErros).some(Boolean)) {
			return;
		}

		const [hInicio, mInicio] = horarioInicio.split(":").map(Number);
		const duracaoMinutos =
			timeToMinutes(horarioFim) - timeToMinutes(horarioInicio);

		onSave({
			id: crypto.randomUUID(),
			nome: clienteSelecionado!.nome,
			servico,
			profissional,
			data: new Date(`${data}T00:00:00`),
			hora: hInicio + mInicio / 60,
			duracao: duracaoMinutos / 60,
			color: CORES_POR_SERVICO[servico] ?? COR_PADRAO,
			observacoes: observacoes.trim() || undefined,
			recorrencia,
		});

		limparFormulario();
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Novo agendamento">
			<form onSubmit={handleSubmit} className="space-y-4">
				<ClienteSelect
					value={clienteSelecionado}
					onChange={setClienteSelecionado}
					error={errors.cliente}
				/>

				<div className="grid grid-cols-2 gap-4">
					<Select
						label="Serviço"
						placeholder="Selecione"
						value={servico}
						onChange={handleServicoChange}
						options={SERVICOS}
						renderOption={renderServico}
						error={errors.servico}
					/>

					<Select
						label="Profissional"
						placeholder="Selecione"
						value={profissional}
						onChange={setProfissional}
						options={PROFISSIONAIS}
						renderOption={renderProfissional}
						error={errors.profissional}
					/>
				</div>

				<Input
					label="Data"
					type="date"
					value={data}
					onChange={(e) => setData(e.target.value)}
					error={errors.data}
				/>

				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Início"
						type="time"
						value={horarioInicio}
						onChange={(e) => handleHorarioInicioChange(e.target.value)}
						error={errors.horarioInicio}
					/>

					<Input
						label="Fim"
						type="time"
						value={horarioFim}
						onChange={(e) => setHorarioFim(e.target.value)}
						error={errors.horarioFim}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Select
						label="Repete"
						value={recorrencia}
						onChange={(v) => setRecorrencia(v as Recorrencia)}
						options={OPCOES_RECORRENCIA}
					/>
					{recorrencia !== "nenhuma" && (
						<p className="text-xs text-slate-500">
							{DESCRICAO_RECORRENCIA[recorrencia]}
						</p>
					)}
				</div>

				<Textarea
					label="Observações"
					placeholder="Detalhes adicionais (opcional)"
					rows={3}
					value={observacoes}
					onChange={(e) => setObservacoes(e.target.value)}
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
