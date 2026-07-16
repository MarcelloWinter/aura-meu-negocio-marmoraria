import { useState } from "react";
import { Plus, Check, MoreVertical, UserX, UserCheck, Trash2 } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { Modal } from "../../ui/Modal";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Permissao = "dashboard" | "atendimento" | "agenda" | "financeiro" | "configuracoes";
type StatusUsuario = "ativo" | "inativo";

type Cargo = "proprietario" | "profissional" | "atendente";

type Usuario = {
	id: string;
	nome: string;
	cargos: Cargo[];
	status: StatusUsuario;
	permissoes: Permissao[];
	cor: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const CARGOS_CONFIG: { value: Cargo; label: string }[] = [
	{ value: "proprietario", label: "Proprietário" },
	{ value: "profissional", label: "Profissional" },
	{ value: "atendente", label: "Atendente" },
];

const PERMISSOES_CONFIG: { value: Permissao; label: string }[] = [
	{ value: "dashboard", label: "Dashboard" },
	{ value: "atendimento", label: "Atendimento" },
	{ value: "agenda", label: "Agenda" },
	{ value: "financeiro", label: "Financeiro" },
	{ value: "configuracoes", label: "Configurações" },
];

const CORES_AVATAR = [
	"bg-slate-400",
	"bg-cyan-400",
	"bg-emerald-400",
	"bg-amber-400",
	"bg-violet-400",
	"bg-rose-400",
];

// ─── Dados mockados ───────────────────────────────────────────────────────────

const MOCK_USUARIOS: Usuario[] = [
	{
		id: "u1",
		nome: "Maria Silva",
		cargos: ["proprietario"],
		status: "ativo",
		permissoes: ["dashboard", "atendimento", "agenda", "financeiro", "configuracoes"],
		cor: "bg-slate-400",
	},
	{
		id: "u2",
		nome: "Júlia Pereira",
		cargos: ["profissional"],
		status: "ativo",
		permissoes: ["atendimento", "agenda"],
		cor: "bg-cyan-400",
	},
	{
		id: "u3",
		nome: "Rafael Nunes",
		cargos: ["atendente"],
		status: "ativo",
		permissoes: ["atendimento", "agenda"],
		cor: "bg-emerald-400",
	},
	{
		id: "u4",
		nome: "Carla Mendes",
		cargos: ["profissional"],
		status: "ativo",
		permissoes: ["financeiro"],
		cor: "bg-amber-400",
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string): string {
	return nome
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join("");
}

// ─── Checkbox de permissão reutilizável ───────────────────────────────────────

function PermissaoItem({
	label,
	ativo,
	onClick,
}: {
	label: string;
	ativo: boolean;
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
				ativo
					? "border-slate-200 bg-white text-slate-700"
					: "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
			} ${onClick ? "cursor-pointer" : "cursor-default"}`}
		>
			<div
				className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
					ativo ? "bg-blue-600" : "border-2 border-slate-300 bg-white"
				}`}
			>
				{ativo && <Check size={10} strokeWidth={3.5} className="text-white" />}
			</div>
			{label}
		</button>
	);
}

// ─── Card de usuário ──────────────────────────────────────────────────────────

function UsuarioCard({
	usuario,
	menuAberto,
	onToggleMenu,
	onTogglePermissao,
	onToggleStatus,
	onExcluir,
}: {
	usuario: Usuario;
	menuAberto: boolean;
	onToggleMenu: () => void;
	onTogglePermissao: (id: string, perm: Permissao) => void;
	onToggleStatus: (id: string) => void;
	onExcluir: (u: Usuario) => void;
}) {
	const inativo = usuario.status === "inativo";

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			{/* Cabeçalho */}
			<div className="flex items-center gap-3">
				{/* Avatar + info — esmaecidos individualmente quando inativo (sem criar stacking context no card) */}
				<div className={`flex min-w-0 flex-1 items-center gap-3 transition ${inativo ? "opacity-60" : ""}`}>
					<div
						className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${usuario.cor} text-sm font-bold text-white`}
					>
						{iniciais(usuario.nome)}
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-slate-900">{usuario.nome}</p>
						<p className="text-xs text-slate-500">
							{usuario.cargos
								.map((c) => CARGOS_CONFIG.find((x) => x.value === c)?.label ?? c)
								.join(", ")}
						</p>
					</div>
				</div>

				<span
					className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${
						inativo ? "bg-slate-100 text-slate-500" : "bg-cyan-100 text-cyan-700"
					}`}
				>
					{inativo ? "Inativo" : "Ativo"}
				</span>

				{/* Menu de ações — fora de qualquer opacity para não travar o z-index do dropdown */}
				<div className="relative">
					<button
						onClick={onToggleMenu}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
					>
						<MoreVertical size={15} />
					</button>

					{menuAberto && (
						<div className="absolute right-0 top-8 z-20 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
							<button
								onClick={() => onToggleStatus(usuario.id)}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
							>
								{inativo
									? <><UserCheck size={14} className="text-cyan-600" /> Reativar</>
									: <><UserX size={14} className="text-slate-500" /> Desativar</>}
							</button>
							<div className="mx-3 border-t border-slate-100" />
							<button
								onClick={() => onExcluir(usuario)}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
							>
								<Trash2 size={14} />
								Excluir
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Permissões — esmaecidas individualmente quando inativo */}
			<div className={`mt-4 transition ${inativo ? "opacity-60" : ""}`}>
				<p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
					Permissões
				</p>
				<div className="grid grid-cols-2 gap-2">
					{PERMISSOES_CONFIG.map((p) => (
						<PermissaoItem
							key={p.value}
							label={p.label}
							ativo={usuario.permissoes.includes(p.value)}
							onClick={() => onTogglePermissao(usuario.id, p.value)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

// ─── Modal de confirmação de exclusão ─────────────────────────────────────────

function ConfirmarExclusaoModal({
	usuario,
	onClose,
	onConfirmar,
}: {
	usuario: Usuario | null;
	onClose: () => void;
	onConfirmar: (id: string) => void;
}) {
	if (!usuario) return null;

	return (
		<Modal isOpen={true} onClose={onClose} title="Excluir usuário">
			<p className="text-sm text-slate-600">
				Tem certeza que deseja excluir <strong className="text-slate-800">{usuario.nome}</strong>?
				Esta ação não pode ser desfeita.
			</p>
			<div className="mt-6 flex justify-end gap-3">
				<Button variant="secondary" className="!w-auto px-5" onClick={onClose}>
					Cancelar
				</Button>
				<button
					onClick={() => onConfirmar(usuario.id)}
					className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
				>
					Excluir
				</button>
			</div>
		</Modal>
	);
}

// ─── Modal de novo usuário ────────────────────────────────────────────────────

function NovoUsuarioModal({
	isOpen,
	onClose,
	onSave,
	proximaCor,
}: {
	isOpen: boolean;
	onClose: () => void;
	onSave: (u: Omit<Usuario, "id">) => void;
	proximaCor: string;
}) {
	const [nome, setNome] = useState("");
	const [cargos, setCargos] = useState<Cargo[]>([]);
	const [permissoes, setPermissoes] = useState<Permissao[]>([]);
	const [errors, setErrors] = useState({ nome: "", cargos: "" });

	function toggleCargo(c: Cargo) {
		setCargos((prev) =>
			prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
		);
	}

	function togglePerm(p: Permissao) {
		setPermissoes((prev) =>
			prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
		);
	}

	function limpar() {
		setNome("");
		setCargos([]);
		setPermissoes([]);
		setErrors({ nome: "", cargos: "" });
	}

	function handleClose() {
		limpar();
		onClose();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const novosErros = {
			nome: nome.trim() ? "" : "Informe o nome.",
			cargos: cargos.length > 0 ? "" : "Selecione ao menos um cargo.",
		};
		setErrors(novosErros);
		if (Object.values(novosErros).some(Boolean)) return;

		onSave({
			nome: nome.trim(),
			cargos,
			status: "ativo",
			permissoes,
			cor: proximaCor,
		});
		limpar();
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Novo usuário">
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label="Nome"
					placeholder="Nome completo"
					autoFocus
					value={nome}
					onChange={(e) => setNome(e.target.value)}
					error={errors.nome}
				/>

				<div>
					<p className="mb-2.5 text-sm font-medium text-slate-700">Cargo</p>
					<div className="grid grid-cols-3 gap-2">
						{CARGOS_CONFIG.map((c) => (
							<PermissaoItem
								key={c.value}
								label={c.label}
								ativo={cargos.includes(c.value)}
								onClick={() => toggleCargo(c.value)}
							/>
						))}
					</div>
					{errors.cargos && (
						<p className="mt-1.5 text-xs text-red-500">{errors.cargos}</p>
					)}
				</div>

				<div>
					<p className="mb-2.5 text-sm font-medium text-slate-700">Permissões</p>
					<div className="grid grid-cols-2 gap-2">
						{PERMISSOES_CONFIG.map((p) => (
							<PermissaoItem
								key={p.value}
								label={p.label}
								ativo={permissoes.includes(p.value)}
								onClick={() => togglePerm(p.value)}
							/>
						))}
					</div>
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
						Adicionar
					</Button>
				</div>
			</form>
		</Modal>
	);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Equipe() {
	const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);
	const [modalAberto, setModalAberto] = useState(false);
	const [menuAberto, setMenuAberto] = useState<string | null>(null);
	const [excluirAlvo, setExcluirAlvo] = useState<Usuario | null>(null);

	function togglePermissao(id: string, perm: Permissao) {
		setUsuarios((prev) =>
			prev.map((u) =>
				u.id !== id
					? u
					: {
							...u,
							permissoes: u.permissoes.includes(perm)
								? u.permissoes.filter((p) => p !== perm)
								: [...u.permissoes, perm],
						},
			),
		);
	}

	function toggleStatus(id: string) {
		setUsuarios((prev) =>
			prev.map((u) =>
				u.id !== id ? u : { ...u, status: u.status === "ativo" ? "inativo" : "ativo" },
			),
		);
		setMenuAberto(null);
	}

	function excluirUsuario(id: string) {
		setUsuarios((prev) => prev.filter((u) => u.id !== id));
		setExcluirAlvo(null);
	}

	function addUsuario(dados: Omit<Usuario, "id">) {
		setUsuarios((prev) => [...prev, { id: crypto.randomUUID(), ...dados }]);
		setModalAberto(false);
	}

	const proximaCor = CORES_AVATAR[usuarios.length % CORES_AVATAR.length];

	return (
		<DashboardLayout>
			<div className="flex h-full flex-col">
				{/* HEADER */}
				<div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
					<div>
						<h1 className="text-xl font-bold text-slate-900 sm:text-3xl">Equipe</h1>
						<p className="mt-1 text-sm text-slate-500">Usuários e permissões por módulo.</p>
					</div>
					<button
						onClick={() => setModalAberto(true)}
						className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
					>
						<Plus size={14} />
						Adicionar usuário
					</button>
				</div>

				{/* CONTEÚDO */}
				<div className="flex-1 overflow-auto p-4 sm:p-6">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{usuarios.map((u) => (
							<UsuarioCard
								key={u.id}
								usuario={u}
								menuAberto={menuAberto === u.id}
								onToggleMenu={() =>
									setMenuAberto(menuAberto === u.id ? null : u.id)
								}
								onTogglePermissao={togglePermissao}
								onToggleStatus={toggleStatus}
								onExcluir={(alvo) => {
									setExcluirAlvo(alvo);
									setMenuAberto(null);
								}}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Overlay para fechar o menu ao clicar fora */}
			{menuAberto && (
				<div
					className="fixed inset-0 z-10"
					onClick={() => setMenuAberto(null)}
				/>
			)}

			<ConfirmarExclusaoModal
				usuario={excluirAlvo}
				onClose={() => setExcluirAlvo(null)}
				onConfirmar={excluirUsuario}
			/>

			<NovoUsuarioModal
				isOpen={modalAberto}
				onClose={() => setModalAberto(false)}
				onSave={addUsuario}
				proximaCor={proximaCor}
			/>
		</DashboardLayout>
	);
}
