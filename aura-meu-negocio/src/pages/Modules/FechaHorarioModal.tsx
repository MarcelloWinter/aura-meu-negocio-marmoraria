import { useState } from "react";

import { Modal } from "../../ui/Modal";
import { Select } from "../../ui/Select";
import type { SelectOption } from "../../ui/Select";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

import type { Bloqueio, Recorrencia } from "./Agenda";

const OPCOES_RECORRENCIA: SelectOption[] = [
	{ label: "Não repete", value: "nenhuma" },
	{ label: "Diariamente", value: "diaria" },
	{ label: "Semanalmente", value: "semanal" },
	{ label: "Quinzenalmente", value: "quinzenal" },
	{ label: "Mensalmente", value: "mensal" },
];

function timeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

const ERROS_VAZIOS = {
	data: "",
	horarioInicio: "",
	horarioFim: "",
};

interface FechaHorarioModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (bloqueio: Omit<Bloqueio, "id">) => void;
}

export function FechaHorarioModal({
	isOpen,
	onClose,
	onSave,
}: FechaHorarioModalProps) {
	const [data, setData] = useState("");
	const [horarioInicio, setHorarioInicio] = useState("");
	const [horarioFim, setHorarioFim] = useState("");
	const [recorrencia, setRecorrencia] = useState<Recorrencia>("nenhuma");
	const [errors, setErrors] = useState(ERROS_VAZIOS);

	function limpar() {
		setData("");
		setHorarioInicio("");
		setHorarioFim("");
		setRecorrencia("nenhuma");
		setErrors(ERROS_VAZIOS);
	}

	function handleClose() {
		limpar();
		onClose();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const fimDepoisDoInicio =
			horarioFim && horarioInicio
				? timeToMinutes(horarioFim) > timeToMinutes(horarioInicio)
				: true;

		const novosErros = {
			data: data ? "" : "Informe a data.",
			horarioInicio: horarioInicio ? "" : "Informe o horário de início.",
			horarioFim: !horarioFim
				? "Informe o horário de fim."
				: !fimDepoisDoInicio
					? "Fim deve ser após o início."
					: "",
		};

		setErrors(novosErros);
		if (Object.values(novosErros).some(Boolean)) return;

		const [hInicio, mInicio] = horarioInicio.split(":").map(Number);
		const [hFim, mFim] = horarioFim.split(":").map(Number);

		onSave({
			data: new Date(`${data}T00:00:00`),
			horaInicio: hInicio + mInicio / 60,
			horaFim: hFim + mFim / 60,
			recorrencia,
		});

		limpar();
	}

	const descricaoRecorrencia: Record<Recorrencia, string> = {
		nenhuma: "",
		diaria: "O horário será bloqueado todos os dias a partir desta data.",
		semanal: "O horário será bloqueado toda semana neste mesmo dia.",
		quinzenal: "O horário será bloqueado a cada duas semanas.",
		mensal: "O horário será bloqueado todo mês neste mesmo dia.",
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Fechar horário">
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label="Data"
					type="date"
					autoFocus
					value={data}
					onChange={(e) => setData(e.target.value)}
					error={errors.data}
				/>

				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Início"
						type="time"
						value={horarioInicio}
						onChange={(e) => setHorarioInicio(e.target.value)}
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
							{descricaoRecorrencia[recorrencia]}
						</p>
					)}
				</div>

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
						Confirmar
					</Button>
				</div>
			</form>
		</Modal>
	);
}
