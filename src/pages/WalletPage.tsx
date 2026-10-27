import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wallet } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { translateError } from "@/lib/errors";
import { useAuthStore } from "@/store/auth.store";

function formatCents(cents: string | number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

const KIND_LABEL: Record<string, { label: string; sign: "+" | "-"; color: string }> = {
	DEPOSIT:            { label: "Depósito",         sign: "+", color: "#16A34A" },
	COMMIT:             { label: "Lance reservado",  sign: "-", color: "#9CA3AF" },
	RELEASE:            { label: "Lance liberado",   sign: "+", color: "#9CA3AF" },
	SETTLEMENT_DEBIT:   { label: "Pagamento",        sign: "-", color: "#DC2626" },
	SETTLEMENT_CREDIT:  { label: "Crédito",          sign: "+", color: "#16A34A" },
};

export function WalletPage() {
	const user = useAuthStore((s) => s.user);
	const qc = useQueryClient();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const { data: balance, isLoading: loadingBalance } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
	});

	const { data: ledger } = useQuery({
		queryKey: ["wallet-ledger"],
		queryFn: () => wallet.ledger(),
	});

	async function handleDeposit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);
		try {
			const cents = Math.round(parseFloat(amount) * 100);
			await wallet.deposit(cents);
			setAmount("");
			setSuccess(true);
			void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
			void qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
		} catch (err) {
			setError(translateError(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#F5F4F0]">
			{/* Header */}
			<div className="bg-white border-b border-[#E4E4E2]">
				<div className="max-w-3xl mx-auto px-6 py-6">
					<p className="text-xs text-[#9CA3AF] font-medium tracking-wider uppercase mb-1">Carteira</p>
					<h1
						className="text-2xl font-bold text-[#0D0D0D]"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{user?.name?.split(" ")[0] ?? "Minha"} Carteira
					</h1>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
				{/* Balance cards */}
				{loadingBalance ? (
					<div className="grid grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4 animate-pulse">
								<div className="h-2.5 bg-[#F3F4F6] rounded w-1/2 mb-3" />
								<div className="h-7 bg-[#F3F4F6] rounded w-3/4" />
							</div>
						))}
					</div>
				) : balance && (
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
							<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">Saldo total</p>
							<p className="text-2xl font-bold text-[#0D0D0D] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
								{formatCents(balance.totalCents)}
							</p>
						</div>
						<div className="bg-white rounded-xl border border-[#1D4ED8]/20 px-5 py-4" style={{ background: "#EFF6FF" }}>
							<p className="text-[11px] text-[#1D4ED8] font-medium uppercase tracking-wider mb-1.5">Disponível</p>
							<p className="text-2xl font-bold text-[#1D4ED8] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
								{formatCents(balance.availableCents)}
							</p>
						</div>
						<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
							<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">Reservado</p>
							<p className="text-2xl font-bold text-[#9CA3AF] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
								{formatCents(balance.committedCents)}
							</p>
						</div>
					</div>
				)}

				{/* Deposit */}
				<div className="bg-white rounded-xl border border-[#E4E4E2] p-6">
					<h2 className="text-base font-semibold text-[#0D0D0D] mb-4">Depositar fundos</h2>
					<form onSubmit={handleDeposit} className="flex gap-3">
						<Input
							type="number"
							step="0.01"
							min="1"
							placeholder="Valor em R$ (ex: 500,00)"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
							className="flex-1"
						/>
						<Button type="submit" disabled={loading || !amount}>
							{loading ? "Depositando…" : "Depositar"}
						</Button>
					</form>
					{success && (
						<p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
							Depósito realizado com sucesso!
						</p>
					)}
					{error && (
						<p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-2.5">
							{error}
						</p>
					)}
				</div>

				{/* Ledger */}
				{ledger && ledger.length > 0 && (
					<div className="bg-white rounded-xl border border-[#E4E4E2] overflow-hidden">
						<div className="px-6 py-4 border-b border-[#F3F4F6]">
							<h2 className="text-base font-semibold text-[#0D0D0D]">
								Extrato
								<span className="ml-2 text-sm font-normal text-[#9CA3AF]">{ledger.length} movimentações</span>
							</h2>
						</div>
						<div className="divide-y divide-[#F3F4F6]">
							{ledger.map((entry) => {
								const meta = KIND_LABEL[entry.kind] ?? { label: entry.kind, sign: "+", color: "#9CA3AF" };
								return (
									<div key={entry.id} className="flex items-center justify-between px-6 py-3.5">
										<div>
											<p className="text-sm font-medium text-[#0D0D0D]">{meta.label}</p>
											<p className="text-xs text-[#9CA3AF] mt-0.5">
												{new Date(entry.createdAt).toLocaleString("pt-BR", {
													day: "2-digit", month: "short", year: "numeric",
													hour: "2-digit", minute: "2-digit",
												})}
											</p>
										</div>
										<span
											className="text-sm font-semibold tabular-nums"
											style={{ color: meta.color, fontFamily: "var(--font-mono)" }}
										>
											{meta.sign}{formatCents(entry.amountCents)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
