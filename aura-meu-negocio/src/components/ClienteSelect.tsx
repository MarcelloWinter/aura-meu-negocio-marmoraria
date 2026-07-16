import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, Phone } from "lucide-react";

import { Modal } from "../ui/Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { useClientes, CORES_AVATAR_CLIENTES } from "../contexts/ClientesContext";
import type { Cliente } from "../contexts/ClientesContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

// ─── Modal de novo cliente rápido ─────────────────────────────────────────────

function NovoClienteRapido({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: (dados: { nome: string; telefone: string }) => void;
}) {
	const [nome, setNome] = useState("");
	const [telefone, setTelefone] = useState("");
	const [errors, setErrors] = useState({ nome: "", telefone: "" });

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const novosErros = {
			nome: nome.trim() ? "" : "Informe o nome.",
			telefone: telefone.trim() ? "" : "Informe o telefone.",
		};
		setErrors(novosErros);
		if (Object.values(novosErros).some(Boolean)) return;
		onSave({ nome: nome.trim(), telefone: telefone.trim() });
	}

	return (
		<Modal isOpen={true} onClose={onClose} title="Novo cliente">
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label="Nome"
					placeholder="Nome completo"
					autoFocus
					value={nome}
					onChange={(e) => setNome(e.target.value)}
					error={errors.nome}
				/>
				<Input
					label="Telefone"
					type="tel"
					placeholder="(11) 99999-9999"
					value={telefone}
					onChange={(e) => setTelefone(e.target.value)}
					error={errors.telefone}
				/>
				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="secondary" className="!w-auto px-5" onClick={onClose}>
						Cancelar
					</Button>
					<Button type="submit" className="!w-auto px-5">
						Adicionar
					</Button>
				</div>
			</form>
		</Modal>
	);
}

// ─── Selector de cliente com busca ────────────────────────────────────────────

export function ClienteSelect({
	value,
	onChange,
	error,
}: {
	value: Cliente | null;
	onChange: (c: Cliente | null) => void;
	error?: string;
}) {
	const { clientes, addCliente } = useClientes();
	const [aberto, setAberto] = useState(false);
	const [busca, setBusca] = useState("");
	const [novoAberto, setNovoAberto] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handle(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setAberto(false);
				setBusca("");
			}
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, []);

	const filtrados = clientes.filter(
		(c) =>
			c.nome.toLowerCase().includes(busca.toLowerCase()) ||
			c.telefone.includes(busca),
	);

	function handleSelect(c: Cliente) {
		onChange(c);
		setAberto(false);
		setBusca("");
	}

	function handleNovoCliente(dados: { nome: string; telefone: string }) {
		const novo = addCliente({
			...dados,
			avatarCor: CORES_AVATAR_CLIENTES[clientes.length % CORES_AVATAR_CLIENTES.length],
			agendamentos: [],
		});
		onChange(novo);
		setNovoAberto(false);
	}

	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium text-slate-700">Cliente</label>

			<div ref={containerRef}>
				{value ? (
					// Cliente selecionado
					<div
						className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
							error ? "border-red-400" : "border-blue-400 ring-1 ring-blue-400"
						} bg-white`}
					>
						<div
							className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${value.avatarCor} text-xs font-bold text-white`}
						>
							{getInitials(value.nome)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-slate-800">{value.nome}</p>
							<div className="flex items-center gap-1 text-xs text-slate-400">
								<Phone size={10} />
								<span>{value.telefone}</span>
							</div>
						</div>
						<button
							type="button"
							onClick={() => onChange(null)}
							className="shrink-0 text-slate-400 transition hover:text-slate-700"
						>
							<X size={14} />
						</button>
					</div>
				) : (
					// Campo de busca
					<div
						className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
							error
								? "border-red-400"
								: aberto
									? "border-blue-400 ring-1 ring-blue-400"
									: "border-slate-300"
						} bg-white`}
					>
						<Search size={13} className="shrink-0 text-slate-400" />
						<input
							type="text"
							placeholder="Buscar cliente..."
							value={busca}
							onFocus={() => setAberto(true)}
							onChange={(e) => {
								setBusca(e.target.value);
								setAberto(true);
							}}
							className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
						/>
						{busca && (
							<button
								type="button"
								onClick={() => setBusca("")}
								className="shrink-0 text-slate-400 transition hover:text-slate-600"
							>
								<X size={13} />
							</button>
						)}
					</div>
				)}

				{/* Lista de clientes (fluxo normal, não flutuante) */}
				{aberto && !value && (
					<div className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
						{filtrados.length > 0 ? (
							<div className="max-h-40 overflow-y-auto">
								{filtrados.map((c) => (
									<button
										key={c.id}
										type="button"
										onClick={() => handleSelect(c)}
										className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
									>
										<div
											className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.avatarCor} text-xs font-bold text-white`}
										>
											{getInitials(c.nome)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-slate-800">{c.nome}</p>
											<div className="flex items-center gap-1 text-xs text-slate-400">
												<Phone size={10} />
												<span>{c.telefone}</span>
											</div>
										</div>
									</button>
								))}
							</div>
						) : (
							<p className="px-3 py-2.5 text-sm text-slate-400">
								{busca
									? `Nenhum resultado para "${busca}".`
									: "Nenhum cliente cadastrado."}
							</p>
						)}
						<div className="border-t border-slate-100" />
						<button
							type="button"
							onClick={() => {
								setNovoAberto(true);
								setAberto(false);
							}}
							className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-blue-600 transition hover:bg-blue-50"
						>
							<Plus size={14} />
							Novo cliente
						</button>
					</div>
				)}
			</div>

			{error && <p className="text-xs text-red-500">{error}</p>}

			{novoAberto && (
				<NovoClienteRapido
					onClose={() => setNovoAberto(false)}
					onSave={handleNovoCliente}
				/>
			)}
		</div>
	);
}
