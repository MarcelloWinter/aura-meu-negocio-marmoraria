import { DashboardLayout } from "../../components/DashboardLayout";

export function Service() {
	const colunas = [
		{
			titulo: "Início",
			total: 2,
			clientes: [
				{
					nome: "Lucas Andrade",
					hora: "09:12",
					mensagem: "Olá, tudo bem?",
				},
				{
					nome: "Beatriz Souza",
					hora: "09:40",
					mensagem: "Quero agendar",
				},
			],
		},
		{
			titulo: "Agendamento",
			total: 3,
			clientes: [
				{
					nome: "Marina L.",
					hora: "10:05",
					mensagem: "Pode ser às 14h?",
				},
				{
					nome: "Carlos Mendes",
					hora: "10:22",
					mensagem: "Vou confirmar",
				},
			],
		},
		{
			titulo: "Cancelamento",
			total: 2,
			clientes: [
				{
					nome: "Pedro Lima",
					hora: "11:30",
					mensagem: "Barba — confirmado",
				},
				{
					nome: "Ana Costa",
					hora: "10:00",
					mensagem: "Corte feminino",
				},
			],
		},
		{
			titulo: "Pagamento",
			total: 1,
			clientes: [
				{
					nome: "Rafa Nunes",
					hora: "Ontem",
					mensagem: "Aguardando proposta",
				},
			],
		},
		{
			titulo: "Atendimento Humano",
			total: 1,
			clientes: [
				{
					nome: "Rafa Nunes",
					hora: "Ontem",
					mensagem: "Aguardando proposta",
				},
			],
		},
		{
			titulo: "Concluído",
			total: 1,
			clientes: [
				{
					nome: "Rafa Nunes",
					hora: "Ontem",
					mensagem: "Aguardando proposta",
				},
			],
		},
	];

	return (
		<DashboardLayout>
			<div className="h-full flex flex-col">
				<div className="border-b bg-white px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:items-center">
					<div>
						<h1 className="text-xl sm:text-3xl font-bold text-slate-900">
							Atendimento
						</h1>

						<p className="text-slate-500 mt-1 text-sm">
							Acompanhe todos os atendimentos em tempo real.
						</p>
					</div>
				</div>

				<div className="flex-1 overflow-x-auto p-6">
					<div className="flex gap-6 min-w-max">
						{colunas.map((coluna) => (
							<div
								key={coluna.titulo}
								className="
									w-[360px]
									flex-shrink-0
									bg-slate-100
									rounded-3xl
									p-4
								"
							>
								<div className="flex items-center justify-between mb-5">
									<div className="flex items-center gap-3">
										<div className="w-2 h-2 rounded-full bg-cyan-500" />

										<h2 className="font-semibold text-slate-800">
											{coluna.titulo}
										</h2>

										<span
											className="
												bg-white
												text-slate-600
												text-xs
												font-medium
												px-2.5
												py-1
												rounded-full
											"
										>
											{coluna.total}
										</span>
									</div>

								</div>

								<div className="space-y-4">
									{coluna.clientes.map(
										(cliente) => (
											<div
												key={`${cliente.nome}-${cliente.hora}`}
												className="
													bg-white
													rounded-2xl
													p-4
													shadow-sm
													border
													border-slate-100
													hover:shadow-md
													cursor-pointer
													transition
												"
											>
												<div className="flex justify-between">
													<div className="flex gap-3">
														<div
															className="
																w-10
																h-10
																rounded-full
																bg-cyan-100
																text-cyan-700
																font-semibold
																flex
																items-center
																justify-center
															"
														>
															{cliente.nome
																.split(
																	" "
																)
																.map(
																	(
																		n
																	) =>
																		n[0]
																)
																.slice(
																	0,
																	2
																)
																.join(
																	""
																)}
														</div>

														<div>
															<h3 className="font-semibold text-slate-900">
																{
																	cliente.nome
																}
															</h3>

															<p className="text-xs text-slate-500">
																{
																	cliente.hora
																}
															</p>
														</div>
													</div>
												</div>

												<p className="mt-4 text-sm text-slate-600">
													{
														cliente.mensagem
													}
												</p>
											</div>
										)
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