import { useState } from "react";
import { CalendarClock, Link2, MessageCircle } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

// ─── Aba: Empresa ─────────────────────────────────────────────────────────────

const EMPRESA_INICIAL = {
	nome: "Marmoraria Decore Granitos",
	cnpj: "",
	telefone: "",
	email: "",
	cep: "",
	rua: "",
	numero: "",
	complemento: "",
	bairro: "",
	cidade: "",
	estado: "",
};

function EmpresaTab() {
	const [dados, setDados] = useState(EMPRESA_INICIAL);
	const [salvo, setSalvo] = useState(false);

	function setCampo(campo: keyof typeof EMPRESA_INICIAL, valor: string) {
		setDados((prev) => ({ ...prev, [campo]: valor }));
		setSalvo(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSalvo(true);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<p className="mb-4 text-sm font-semibold text-slate-800">Dados da empresa</p>
				<div className="space-y-4">
					<Input
						label="Nome da empresa"
						placeholder="Nome da sua empresa"
						value={dados.nome}
						onChange={(e) => setCampo("nome", e.target.value)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="CNPJ (opcional)"
							placeholder="00.000.000/0000-00"
							value={dados.cnpj}
							onChange={(e) => setCampo("cnpj", e.target.value)}
						/>
						<Input
							label="Telefone"
							type="tel"
							placeholder="(11) 99999-9999"
							value={dados.telefone}
							onChange={(e) => setCampo("telefone", e.target.value)}
						/>
					</div>
					<Input
						label="E-mail"
						type="email"
						placeholder="contato@suaempresa.com"
						value={dados.email}
						onChange={(e) => setCampo("email", e.target.value)}
					/>
				</div>
			</div>

			<div>
				<p className="mb-4 text-sm font-semibold text-slate-800">Endereço</p>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="CEP"
							placeholder="00000-000"
							value={dados.cep}
							onChange={(e) => setCampo("cep", e.target.value)}
						/>
						<Input
							label="Número"
							placeholder="123"
							value={dados.numero}
							onChange={(e) => setCampo("numero", e.target.value)}
						/>
					</div>
					<Input
						label="Rua"
						placeholder="Nome da rua"
						value={dados.rua}
						onChange={(e) => setCampo("rua", e.target.value)}
					/>
					<Input
						label="Complemento"
						placeholder="Sala, bloco, referência…"
						value={dados.complemento}
						onChange={(e) => setCampo("complemento", e.target.value)}
					/>
					<Input
						label="Bairro"
						placeholder="Bairro"
						value={dados.bairro}
						onChange={(e) => setCampo("bairro", e.target.value)}
					/>
					<div className="grid grid-cols-[1fr_auto] gap-4">
						<Input
							label="Cidade"
							placeholder="Cidade"
							value={dados.cidade}
							onChange={(e) => setCampo("cidade", e.target.value)}
						/>
						<Input
							label="UF"
							placeholder="SP"
							maxLength={2}
							value={dados.estado}
							onChange={(e) => setCampo("estado", e.target.value.toUpperCase())}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
				{salvo && (
					<span className="text-sm font-medium text-emerald-600">Alterações salvas.</span>
				)}
				<Button type="submit" className="!w-auto px-6">
					Salvar alterações
				</Button>
			</div>
		</form>
	);
}

// ─── Aba: Integrações ─────────────────────────────────────────────────────────

type StatusIntegracao = "conectado" | "desconectado";

type Integracao = {
	id: string;
	nome: string;
	descricao: string;
	Icon: React.ElementType;
	status: StatusIntegracao;
};

const INTEGRACOES_INICIAIS: Integracao[] = [
	{
		id: "whatsapp",
		nome: "WhatsApp (via n8n)",
		descricao: "Envio de mensagens e recuperação de senha por WhatsApp.",
		Icon: MessageCircle,
		status: "conectado",
	},
	{
		id: "google-agenda",
		nome: "Google Agenda",
		descricao: "Sincroniza os agendamentos automaticamente.",
		Icon: CalendarClock,
		status: "desconectado",
	},
	{
		id: "webhook",
		nome: "Webhook personalizado",
		descricao: "Receba eventos do sistema em tempo real.",
		Icon: Link2,
		status: "desconectado",
	},
];

function IntegracoesTab() {
	const [integracoes, setIntegracoes] = useState(INTEGRACOES_INICIAIS);

	function alternarStatus(id: string) {
		setIntegracoes((prev) =>
			prev.map((item) =>
				item.id !== id
					? item
					: { ...item, status: item.status === "conectado" ? "desconectado" : "conectado" },
			),
		);
	}

	return (
		<div className="divide-y divide-slate-100">
			{integracoes.map((item) => {
				const conectado = item.status === "conectado";
				const Icon = item.Icon;
				return (
					<div
						key={item.id}
						className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="flex min-w-0 items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
								<Icon size={18} />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-semibold text-slate-900">{item.nome}</p>
								<p className="text-xs text-slate-500">{item.descricao}</p>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-3">
							<span
								className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
									conectado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
								}`}
							>
								{conectado ? "Conectado" : "Não conectado"}
							</span>
							<button
								type="button"
								onClick={() => alternarStatus(item.id)}
								className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
									conectado
										? "border border-slate-200 text-slate-600 hover:bg-slate-50"
										: "bg-blue-600 text-white hover:bg-blue-700"
								}`}
							>
								{conectado ? "Desconectar" : "Conectar"}
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Aba = "empresa" | "integracoes";

const ABAS: { value: Aba; label: string }[] = [
	{ value: "empresa", label: "Empresa" },
	{ value: "integracoes", label: "Integrações" },
];

export function Configuracoes() {
	const [aba, setAba] = useState<Aba>("empresa");

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-6">
					<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">Configurações</h1>
					<p className="mt-1 text-sm text-slate-500">Personalize seu Aura.</p>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 overflow-auto p-4 sm:p-6">
					<div className="mb-5 inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
						{ABAS.map((item) => (
							<button
								key={item.value}
								onClick={() => setAba(item.value)}
								className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
									aba === item.value
										? "border border-blue-500 bg-white text-blue-600 shadow-sm"
										: "border border-transparent text-slate-500 hover:text-slate-700"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
						{aba === "empresa" ? <EmpresaTab /> : <IntegracoesTab />}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
