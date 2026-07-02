import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-lg"
				style={{ maxHeight: "90vh" }}
			>
				{/* Header fixo — nunca some com scroll */}
				<div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
					<h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>

					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 transition hover:text-slate-600"
					>
						<X size={20} />
					</button>
				</div>

				{/* Conteúdo com scroll quando o formulário crescer */}
				<div className="overflow-y-auto px-6 pb-6">{children}</div>
			</div>
		</div>
	);
}
