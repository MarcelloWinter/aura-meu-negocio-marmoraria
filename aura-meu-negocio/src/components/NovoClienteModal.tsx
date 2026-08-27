import { useState } from "react";

import { Modal } from "../ui/Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { getApiErrorMessage } from "../services/api";
import { useClientes, CORES_AVATAR_CLIENTES } from "../contexts/ClientesContext";
import type { Cliente } from "../contexts/ClientesContext";

const ENDERECO_VAZIO = {
	cep: "",
	rua: "",
	numero: "",
	complemento: "",
	bairro: "",
	cidade: "",
	estado: "",
};

export function NovoClienteModal({
	isOpen,
	onClose,
	onCreated,
}: {
	isOpen: boolean;
	onClose: () => void;
	onCreated?: (cliente: Cliente) => void;
}) {
	const { clientes, addCliente } = useClientes();

	const [nome, setNome] = useState("");
	const [telefone, setTelefone] = useState("");
	const [cpfCnpj, setCpfCnpj] = useState("");
	const [email, setEmail] = useState("");
	const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
	const [errors, setErrors] = useState({ nome: "", telefone: "" });
	const [salvando, setSalvando] = useState(false);
	const [erroSalvar, setErroSalvar] = useState("");

	function setCampoEndereco(campo: keyof typeof ENDERECO_VAZIO, valor: string) {
		setEndereco((prev) => ({ ...prev, [campo]: valor }));
	}

	function limpar() {
		setNome("");
		setTelefone("");
		setCpfCnpj("");
		setEmail("");
		setEndereco(ENDERECO_VAZIO);
		setErrors({ nome: "", telefone: "" });
		setErroSalvar("");
	}

	function handleClose() {
		limpar();
		onClose();
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const novosErros = {
			nome: nome.trim() ? "" : "Informe o nome do cliente.",
			telefone: telefone.trim() ? "" : "Informe o número de telefone.",
		};
		setErrors(novosErros);
		if (Object.values(novosErros).some(Boolean)) return;

		const enderecoPreenchido = Object.fromEntries(
			Object.entries(endereco)
				.map(([campo, valor]) => [campo, valor.trim()])
				.filter(([, valor]) => valor),
		);

		setSalvando(true);
		setErroSalvar("");
		try {
			const novo = await addCliente({
				nome: nome.trim(),
				telefone: telefone.trim(),
				cpfCnpj: cpfCnpj.trim() || undefined,
				email: email.trim() || undefined,
				endereco: Object.keys(enderecoPreenchido).length > 0 ? enderecoPreenchido : undefined,
				avatarCor: CORES_AVATAR_CLIENTES[clientes.length % CORES_AVATAR_CLIENTES.length],
				agendamentos: [],
			});

			onCreated?.(novo);
			limpar();
			onClose();
		} catch (err) {
			setErroSalvar(getApiErrorMessage(err, "Não foi possível salvar o cliente."));
		} finally {
			setSalvando(false);
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Novo cliente">
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
				<Input
					label="CPF/CNPJ (opcional)"
					placeholder="000.000.000-00"
					value={cpfCnpj}
					onChange={(e) => setCpfCnpj(e.target.value)}
				/>
				<Input
					label="E-mail (opcional)"
					type="email"
					placeholder="cliente@email.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<div>
					<p className="mb-3 text-sm font-medium text-slate-700">Endereço (opcional)</p>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="CEP"
								placeholder="00000-000"
								value={endereco.cep}
								onChange={(e) => setCampoEndereco("cep", e.target.value)}
							/>
							<Input
								label="Número"
								placeholder="123"
								value={endereco.numero}
								onChange={(e) => setCampoEndereco("numero", e.target.value)}
							/>
						</div>
						<Input
							label="Rua"
							placeholder="Nome da rua"
							value={endereco.rua}
							onChange={(e) => setCampoEndereco("rua", e.target.value)}
						/>
						<Input
							label="Complemento"
							placeholder="Apto, bloco, referência…"
							value={endereco.complemento}
							onChange={(e) => setCampoEndereco("complemento", e.target.value)}
						/>
						<Input
							label="Bairro"
							placeholder="Bairro"
							value={endereco.bairro}
							onChange={(e) => setCampoEndereco("bairro", e.target.value)}
						/>
						<div className="grid grid-cols-[1fr_auto] gap-4">
							<Input
								label="Cidade"
								placeholder="Cidade"
								value={endereco.cidade}
								onChange={(e) => setCampoEndereco("cidade", e.target.value)}
							/>
							<Input
								label="UF"
								placeholder="SP"
								maxLength={2}
								value={endereco.estado}
								onChange={(e) => setCampoEndereco("estado", e.target.value.toUpperCase())}
							/>
						</div>
					</div>
				</div>
				{erroSalvar && <p className="text-sm text-red-500">{erroSalvar}</p>}
				<div className="flex justify-end gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						className="!w-auto px-5"
						onClick={handleClose}
						disabled={salvando}
					>
						Cancelar
					</Button>
					<Button type="submit" className="!w-auto px-5" disabled={salvando}>
						{salvando ? "Salvando…" : "Adicionar"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
