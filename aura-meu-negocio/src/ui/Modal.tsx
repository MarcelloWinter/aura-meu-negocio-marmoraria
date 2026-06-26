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
				className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
			>
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>

					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 transition hover:text-slate-600"
					>
						<X size={20} />
					</button>
				</div>

				{children}
			</div>
		</div>
	);
}
