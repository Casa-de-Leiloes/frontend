import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { users } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

export function MyActivityPage() {
	const { data: bidsData, isLoading: loadingBids } = useQuery({
		queryKey: ["my-bids"],
		queryFn: () => users.myBids(),
	});

	const { data: wins, isLoading: loadingWins } = useQuery({
		queryKey: ["my-wins"],
		queryFn: () => users.myWins(),
	});

	return (
		<div className="p-6 lg:p-8 max-w-3xl space-y-8">
			<h1 className="text-xl font-bold text-foreground">Minha Atividade</h1>

			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-sm font-semibold text-foreground mb-4">Vitórias</h2>

				{loadingWins && (
					<p className="text-sm text-muted-foreground">Carregando…</p>
				)}
				{!loadingWins && wins?.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Nenhuma vitória ainda.
					</p>
				)}

				<div className="space-y-3">
					{wins?.map((win) => (
						<div
							key={win.lotId}
							className="flex items-center justify-between border border-border rounded-lg px-4 py-3 gap-4"
						>
							<div>
								<Link
									to={`/lots/${win.lotId}`}
									className="text-sm font-medium hover:underline text-foreground"
								>
									Lote #{win.lotId.slice(-6).toUpperCase()}
								</Link>
								<p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
									{formatCents(win.amountCents)}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1d5fbf] text-white">
									Vencedor
								</span>
								{win.receiptToken && (
									<>
										<Link
											to={`/receipt/${win.receiptToken}`}
											className="text-xs underline text-foreground hover:text-muted-foreground"
										>
											Comprovante
										</Link>
										<button
											type="button"
											className="text-xs underline text-muted-foreground hover:text-foreground"
											onClick={() => {
												void navigator.clipboard.writeText(
													`${window.location.origin}/receipt/${win.receiptToken}`,
												);
											}}
										>
											Copiar link
										</button>
									</>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-sm font-semibold text-foreground mb-4">
					Histórico de lances
				</h2>

				{loadingBids && (
					<p className="text-sm text-muted-foreground">Carregando…</p>
				)}
				{!loadingBids && bidsData?.items.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Nenhum lance dado ainda.
					</p>
				)}

				<div className="space-y-0">
					{bidsData?.items.map((bid) => (
						<div
							key={bid.id}
							className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-sm"
						>
							<Link
								to={bid.lotId ? `/lots/${bid.lotId}` : "#"}
								className="text-muted-foreground hover:text-foreground hover:underline"
							>
								{bid.lotId ? `Lote #${bid.lotId.slice(-6).toUpperCase()}` : "—"}
							</Link>
							<span className="font-semibold font-mono tabular-nums">
								{formatCents(bid.amountCents)}
							</span>
							<span className="text-xs text-muted-foreground">
								{new Date(bid.placedAt).toLocaleString("pt-BR")}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
