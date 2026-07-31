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

const PROFISSIONAIS: SelectOption[] = [
	{ label: "Júlia", value: "Júlia" },
	{ label: "Rafa", value: "Rafa" },
	{ label: "Você", value: "Você" },
];

const DURACAO_PADRAO = 60;

const COR_AVATAR_POR_PROFISSIONAL: Record<string, string> = {
	Júlia: "bg-violet-100 text-violet-700",
	Rafa: "bg-amber-100 text-amber-700",
	Você: "bg-emerald-100 text-emerald-700",
};
const COR_AVATAR_PADRAO = "bg-slate-100 text-slate-600";

const COR_EVENTO_PADRAO = "bg-purple-100 border-purple-500";

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
	const [profissional, setProfissional] = useState("");
	const [data, setData] = useState("");
	const [horarioInicio, setHorarioInicio] = useState("");
	const [horarioFim, setHorarioFim] = useState("");
	const [recorrencia, setRecorrencia] = useState<Recorrencia>("nenhuma");
	const [observacoes, setObservacoes] = useState("");

	const [errors, setErrors] = useState(ERROS_VAZIOS);

	function recalcularFim(inicio: string) {
		if (!inicio) return;
		setHorarioFim(addMinutesToTime(inicio, DURACAO_PADRAO));
	}

	function handleHorarioInicioChange(value: string) {
		setHorarioInicio(value);
		recalcularFim(value);
	}

	function limparFormulario() {
		setClienteSelecionado(null);
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
			profissional,
			data: new Date(`${data}T00:00:00`),
			hora: hInicio + mInicio / 60,
			duracao: duracaoMinutos / 60,
			color: COR_EVENTO_PADRAO,
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

				<Select
					label="Profissional"
					placeholder="Selecione"
					value={profissional}
					onChange={setProfissional}
					options={PROFISSIONAIS}
					renderOption={renderProfissional}
					error={errors.profissional}
				/>

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
