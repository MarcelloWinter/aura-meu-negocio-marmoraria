import { useState } from "react";

import { Modal } from "../../ui/Modal";
import { Select } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

import type { Evento } from "./Agenda";

const SERVICOS = [
	"Corte feminino",
	"Corte masculino",
	"Barba",
	"Avaliação",
	"Manicure",
];

const PROFISSIONAIS = ["Júlia", "Rafa", "Você"];

const CORES_POR_SERVICO: Record<string, string> = {
	"Corte feminino": "bg-blue-100 border-blue-500",
	"Corte masculino": "bg-indigo-100 border-indigo-500",
	Barba: "bg-green-100 border-green-500",
	Avaliação: "bg-cyan-100 border-cyan-500",
	Manicure: "bg-pink-100 border-pink-500",
};

const COR_PADRAO = "bg-purple-100 border-purple-500";

const ERROS_VAZIOS = {
	cliente: "",
	servico: "",
	profissional: "",
	data: "",
	horario: "",
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
	const [cliente, setCliente] = useState("");
	const [servico, setServico] = useState("");
	const [profissional, setProfissional] = useState("");
	const [data, setData] = useState("");
	const [horario, setHorario] = useState("");
	const [observacoes, setObservacoes] = useState("");

	const [errors, setErrors] = useState(ERROS_VAZIOS);

	function limparFormulario() {
		setCliente("");
		setServico("");
		setProfissional("");
		setData("");
		setHorario("");
		setObservacoes("");
		setErrors(ERROS_VAZIOS);
	}

	function handleClose() {
		limparFormulario();
		onClose();
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const novosErros = {
			cliente: cliente.trim() ? "" : "Informe o cliente.",
			servico: servico ? "" : "Selecione o serviço.",
			profissional: profissional ? "" : "Selecione o profissional.",
			data: data ? "" : "Informe a data.",
			horario: horario ? "" : "Informe o horário.",
		};

		setErrors(novosErros);

		if (Object.values(novosErros).some(Boolean)) {
			return;
		}

		const [horas, minutos] = horario.split(":").map(Number);

		onSave({
			id: crypto.randomUUID(),
			nome: cliente,
			servico,
			profissional,
			data: new Date(`${data}T00:00:00`),
			hora: horas + minutos / 60,
			duracao: 1,
			color: CORES_POR_SERVICO[servico] ?? COR_PADRAO,
			observacoes: observacoes.trim() || undefined,
		});

		limparFormulario();
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Novo agendamento">
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label="Cliente"
					placeholder="Nome do cliente"
					autoFocus
					value={cliente}
					onChange={(e) => setCliente(e.target.value)}
					error={errors.cliente}
				/>

				<div className="grid grid-cols-2 gap-4">
					<Select
						label="Serviço"
						placeholder="Selecione"
						value={servico}
						onChange={(e) => setServico(e.target.value)}
						options={SERVICOS.map((s) => ({ label: s, value: s }))}
						error={errors.servico}
					/>

					<Select
						label="Profissional"
						placeholder="Selecione"
						value={profissional}
						onChange={(e) => setProfissional(e.target.value)}
						options={PROFISSIONAIS.map((p) => ({ label: p, value: p }))}
						error={errors.profissional}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Data"
						type="date"
						value={data}
						onChange={(e) => setData(e.target.value)}
						error={errors.data}
					/>

					<Input
						label="Horário"
						type="time"
						value={horario}
						onChange={(e) => setHorario(e.target.value)}
						error={errors.horario}
					/>
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
