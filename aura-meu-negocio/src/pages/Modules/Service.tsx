export function Service() {
	const colunas = [
		{
			titulo: "Novo",
			total: 2,
			clientes: [
				{
					nome: "Lucas Andrade",
					hora: "09:12",
					mensagem: "Olá, tudo bem?",
					canal: "WhatsApp",
				},
				{
					nome: "Beatriz Souza",
					hora: "09:40",
					mensagem: "Quero agendar",
					canal: "Instagram",
				},
			],
		},
		{
			titulo: "Em Atendimento",
			total: 3,
			clientes: [
				{
					nome: "Marina L.",
					hora: "10:05",
					mensagem: "Pode ser às 14h?",
					canal: "WhatsApp",
				},
				{
					nome: "Carlos Mendes",
					hora: "10:22",
					mensagem: "Vou confirmar",
					canal: "Telefone",
				},
			],
		},
		{
			titulo: "Agendado",
			total: 2,
			clientes: [
				{
					nome: "Pedro Lima",
					hora: "11:30",
					mensagem: "Barba — confirmado",
					canal: "Agenda",
				},
				{
					nome: "Ana Costa",
					hora: "10:00",
					mensagem: "Corte feminino",
					canal: "Agenda",
				},
			],
		},
		{
			titulo: "Aguardando Retorno",
			total: 1,
			clientes: [
				{
					nome: "Rafa Nunes",
					hora: "Ontem",
					mensagem: "Aguardando proposta",
					canal: "Email",
				},
			],
		},
	];

	return (
		<div className="p-8 h-full">
			<h1 className="text-4xl font-bold text-slate-900">
				Atendimento
			</h1>

			<p className="text-slate-500 mt-1 mb-8">
				Acompanhe todas as conversas em um só lugar.
			</p>

			<div className="flex gap-4 overflow-x-auto pb-4">
				{colunas.map((coluna) => (
					<div
						key={coluna.titulo}
						className="min-w-[320px]"
					>
						<div className="bg-white border rounded-2xl p-4 flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-cyan-500" />

								<span className="font-semibold">
									{coluna.titulo}
								</span>

								<span className="bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
									{coluna.total}
								</span>
							</div>

							<button className="text-xl">
								+
							</button>
						</div>

						<div className="space-y-4">
							{coluna.clientes.map(
								(cliente) => (
									<div
										key={`${cliente.nome}-${cliente.hora}`}
										className="bg-white border rounded-3xl p-4 shadow-sm hover:shadow-md transition"
									>
										<div className="flex justify-between">
											<div className="flex gap-3">
												<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm">
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
													<h3 className="font-semibold">
														{
															cliente.nome
														}
													</h3>

													<p className="text-sm text-slate-500">
														{
															cliente.hora
														}
													</p>
												</div>
											</div>

											<button>
												⋯
											</button>
										</div>

										<div className="mt-4 text-sm text-slate-500">
											{
												cliente.mensagem
											}
										</div>

										<div className="mt-4">
											<span className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
												{
													cliente.canal
												}
											</span>
										</div>
									</div>
								)
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}