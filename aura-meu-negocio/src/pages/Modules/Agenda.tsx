import { useState } from "react";
import { Plus } from "lucide-react";
import {
	format,
	startOfWeek,
	addDays,
	addWeeks,
	subWeeks,
	isSameDay,
} from "date-fns";

import { ptBR } from "date-fns/locale";

import { DashboardLayout } from "../../components/DashboardLayout";
import { NovoAgendamentoModal } from "./NovoAgendamentoModal";

export type Evento = {
	id: string;
	nome: string;
	servico: string;
	profissional: string;
	data: Date;
	hora: number;
	duracao: number;
	color: string;
	observacoes?: string;
};

function eventosIniciais(): Evento[] {
	const inicioSemanaAtual = startOfWeek(new Date(), { weekStartsOn: 1 });

	return [
		{
			id: "1",
			nome: "Ana Costa",
			servico: "Corte feminino",
			profissional: "Júlia",
			data: addDays(inicioSemanaAtual, 0),
			hora: 9,
			duracao: 1,
			color: "bg-blue-100 border-blue-500",
		},
		{
			id: "2",
			nome: "Pedro Lima",
			servico: "Barba",
			profissional: "Rafa",
			data: addDays(inicioSemanaAtual, 2),
			hora: 10,
			duracao: 1,
			color: "bg-green-100 border-green-500",
		},
		{
			id: "3",
			nome: "Lucas A.",
			servico: "Avaliação",
			profissional: "Você",
			data: addDays(inicioSemanaAtual, 4),
			hora: 9,
			duracao: 1,
			color: "bg-cyan-100 border-cyan-500",
		},
	];
}

export function Agenda() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [eventos, setEventos] = useState<Evento[]>(eventosIniciais);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Semana começando na segunda
	const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });

	const dias = Array.from({ length: 7 }).map((_, i) => addDays(startWeek, i));

	// 08h até 20h
	const horas = Array.from({ length: 24 }).map((_, i) => 0 + i);

	const HOUR_HEIGHT = 64; // altura de cada hora

	return (
		<DashboardLayout>
			<div className="h-full flex flex-col">
				{/* HEADER */}
				<div className="border-b border-slate-200 bg-white px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center">
					<div>
						<h1 className="text-xl sm:text-3xl font-bold text-slate-900">
							Agenda
						</h1>

						<p className="text-slate-500 mt-1 capitalize text-sm">
							{format(currentDate, "MMMM yyyy", { locale: ptBR })}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
							className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm"
						>
							←
						</button>

						<button className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm">
							Hoje
						</button>

						<button
							onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
							className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm"
						>
							→
						</button>

						<button
							onClick={() => setIsModalOpen(true)}
							className="ml-0 sm:ml-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl transition text-sm"
						>
							<Plus size={14} />

							{/* Esconde texto no mobile */}
							<span className="hidden sm:inline">Novo agendamento</span>
						</button>
					</div>
				</div>

				{/* GRID */}
				<div className="flex-1 overflow-auto p-6">
					<div className="min-w-[900px] bg-white rounded-2xl border border-slate-200 overflow-hidden">
						{/* Header dias */}
						<div className="grid grid-cols-8 border-b border-slate-200">
							<div className="w-[50px]" />

							{dias.map((dia, index) => {
								const isToday =
									new Date().toDateString() === dia.toDateString();

								return (
									<div
										key={index}
										className={`text-center py-3 ${
											isToday ? "bg-blue-50" : ""
										}`}
									>
										<p className="text-xs text-slate-500 font-medium">
											{format(dia, "EEE", { locale: ptBR })
												.toUpperCase()
												.slice(0, 3)}
										</p>

										<p className="text-lg font-semibold text-slate-800">
											{format(dia, "dd")}
										</p>
									</div>
								);
							})}
						</div>

						{/* Corpo */}
						<div className="grid grid-cols-8">
							{/* Horas */}
							<div className="w-[50px] pr-1 bg-white">
								{horas.map((h) => (
									<div
										key={h}
										className="h-16 text-[10px] text-slate-400 text-right pr-1 pt-1"
									>
										{h}:00
									</div>
								))}
							</div>

							{/* Dias */}
							{dias.map((dia, diaIndex) => (
								<div
									key={diaIndex}
									className="relative border-l border-slate-200"
								>
									{/* Linhas */}
									{horas.map((h) => (
										<div
											key={h}
											className="h-16 border-b border-slate-100 hover:bg-slate-50 transition"
										/>
									))}

									{/* Eventos */}
									{eventos
										.filter((evento) => isSameDay(evento.data, dia))
										.map((evento) => (
											<div
												key={evento.id}
												className={`
													absolute left-1 right-1
													${evento.color}
													border-l-4
													rounded-xl p-2 text-xs shadow-sm
												`}
												style={{
													top: evento.hora * HOUR_HEIGHT,
													height: evento.duracao * HOUR_HEIGHT,
												}}
											>
												<p className="font-semibold text-slate-800">
													{evento.nome}
												</p>

												<p className="text-slate-600">{evento.servico}</p>

												<p className="text-slate-400">{evento.profissional}</p>
											</div>
										))}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<NovoAgendamentoModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={(novoEvento) => {
					setEventos((prev) => [...prev, novoEvento]);
					setIsModalOpen(false);
				}}
			/>
		</DashboardLayout>
	);
}
