import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wallet } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function formatCents(cents: string): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

export function WalletPage() {
	const qc = useQueryClient();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const { data: balance, isLoading } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
	});

	async function handleDeposit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const cents = Math.round(parseFloat(amount) * 100);
			await wallet.deposit(cents);
			setAmount("");
			void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Falha ao depositar");
		} finally {
			setLoading(false);
		}
	}

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
				Carregando carteira…
			</div>
		);

	return (
		<div className="p-6 lg:p-8 max-w-2xl">
			<h1 className="text-xl font-bold text-foreground mb-6">Minha Carteira</h1>

			{balance && (
				<div className="grid grid-cols-3 gap-4 mb-8">
					<div className="bg-surface border border-border rounded-lg p-4">
						<p className="text-xs text-muted-foreground mb-1">Saldo total</p>
						<p className="text-lg font-bold font-mono tabular-nums">
							{formatCents(balance.totalCents)}
						</p>
					</div>
					<div className="bg-surface border border-border rounded-lg p-4">
						<p className="text-xs text-muted-foreground mb-1">Disponível</p>
						<p className="text-lg font-bold font-mono tabular-nums text-[#1d5fbf]">
							{formatCents(balance.availableCents)}
						</p>
					</div>
					<div className="bg-surface border border-border rounded-lg p-4">
						<p className="text-xs text-muted-foreground mb-1">Comprometido</p>
						<p className="text-lg font-bold font-mono tabular-nums text-muted-foreground">
							{formatCents(balance.committedCents)}
						</p>
					</div>
				</div>
			)}

			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-base font-semibold text-foreground mb-4">
					Depositar fundos
				</h2>
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
					<Button type="submit" disabled={loading}>
						{loading ? "Depositando…" : "Depositar"}
					</Button>
				</form>
				{error && (
					<p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2 mt-3">
						{error}
					</p>
				)}
			</div>
		</div>
	);
}
