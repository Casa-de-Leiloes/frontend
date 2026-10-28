import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { users, wallet } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

export function MyActivityPage() {
	const user = useAuthStore((s) => s.user);

	const { data: bidsData, isLoading: loadingBids } = useQuery({
		queryKey: ["my-bids"],
		queryFn: () => users.myBids(),
	});

	const { data: wins, isLoading: loadingWins } = useQuery({
		queryKey: ["my-wins"],
		queryFn: () => users.myWins(),
	});

	const { data: balance } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
	});

	const totalSpent = wins?.reduce((s, w) => s + Number(w.amountCents), 0) ?? 0;

	return (
		<div className="min-h-screen bg-[var(--ground)]">
			{/* Header */}
			<div className="bg-[var(--surface)] border-b border-[var(--border)]">
				<div className="max-w-3xl mx-auto px-6 py-6">
					<p className="text-xs text-[var(--ink-subtle)] font-medium tracking-wider uppercase mb-1">Atividade</p>
					<h1
						className="text-2xl font-bold text-[var(--ink)]"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Olá, {user?.name?.split(" ")[0] ?? "Comprador"}
					</h1>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
				{/* Stats */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Vitórias</p>
						<p className="text-3xl font-bold text-[var(--accent)] tabular-nums">{wins?.length ?? 0}</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Lances dados</p>
						<p className="text-3xl font-bold text-[var(--ink)] tabular-nums">{bidsData?.items.length ?? 0}</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Total gasto</p>
						<p className="text-lg font-bold text-[var(--ink)] tabular-nums leading-tight mt-1">
							{formatCents(String(totalSpent))}
						</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Disponível</p>
						<p className="text-lg font-bold text-[var(--accent)] tabular-nums leading-tight mt-1">
							{balance ? formatCents(balance.availableCents) : "-"}
						</p>
					</div>
				</div>

				{/* Wins */}
				<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
					<div className="px-6 py-4 border-b border-[#F3F4F6]">
						<h2 className="text-base font-semibold text-[var(--ink)]">
							Arremates
							{wins && wins.length > 0 && (
								<span className="ml-2 text-sm font-normal text-[var(--ink-subtle)]">{wins.length}</span>
							)}
						</h2>
					</div>

					{loadingWins ? (
						<div className="px-6 py-4 space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="h-14 bg-[var(--subtle-bg2)] rounded-lg animate-pulse" />
							))}
						</div>
					) : !wins || wins.length === 0 ? (
						<div className="px-6 py-12 text-center">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-3" aria-hidden>
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							<p className="text-sm text-[var(--ink-subtle)]">Nenhum arremate ainda.</p>
							<Link to="/" className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline font-medium">
								Ver leilões ao vivo →
							</Link>
						</div>
					) : (
						<div className="divide-y divide-[#F3F4F6]">
							{wins.map((win) => (
								<div key={win.lotId} className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
									<div>
										<Link
											to={`/lots/${win.lotId}`}
											className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
										>
											Lote #{win.lotId.slice(-8).toUpperCase()}
										</Link>
										<p
											className="text-base font-bold tabular-nums mt-0.5"
											style={{ color: "#1D4ED8", fontFamily: "var(--font-mono)" }}
										>
											{formatCents(win.amountCents)}
										</p>
									</div>
									<div className="flex items-center gap-2.5">
										<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[var(--positive)]">
											<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
											Arrematado
										</span>
										{win.receiptToken && (
											<div className="flex items-center gap-1.5">
												<Link
													to={`/receipt/${win.receiptToken}`}
													className="text-xs text-[var(--accent)] hover:underline font-medium"
												>
													Comprovante
												</Link>
												<button
													type="button"
													className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors"
													title="Copiar link"
													onClick={() => {
														void navigator.clipboard.writeText(
															`${window.location.origin}/receipt/${win.receiptToken}`,
														);
													}}
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
														<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
													</svg>
												</button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Bid history */}
				<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
					<div className="px-6 py-4 border-b border-[#F3F4F6]">
						<h2 className="text-base font-semibold text-[var(--ink)]">
							Histórico de lances
							{bidsData && bidsData.items.length > 0 && (
								<span className="ml-2 text-sm font-normal text-[var(--ink-subtle)]">{bidsData.items.length}</span>
							)}
						</h2>
					</div>

					{loadingBids ? (
						<div className="px-6 py-4 space-y-2">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-10 bg-[var(--subtle-bg2)] rounded animate-pulse" />
							))}
						</div>
					) : !bidsData || bidsData.items.length === 0 ? (
						<div className="px-6 py-12 text-center">
							<p className="text-sm text-[var(--ink-subtle)]">Nenhum lance dado ainda.</p>
						</div>
					) : (
						<div className="divide-y divide-[#F3F4F6]">
							{bidsData.items.map((bid) => (
								<div key={bid.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#FAFAFA] transition-colors">
									<div className="flex items-center gap-3">
										<span className="text-[11px] text-[var(--ink-subtle)] tabular-nums">
											#{bid.sequence}
										</span>
										<Link
											to={bid.lotId ? `/lots/${bid.lotId}` : "#"}
											className="text-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
										>
											{bid.lotId ? `Lote #${bid.lotId.slice(-8).toUpperCase()}` : "-"}
										</Link>
									</div>
									<div className="flex items-center gap-4 text-right">
										<span
											className="text-sm font-semibold tabular-nums"
											style={{ color: "#1D4ED8", fontFamily: "var(--font-mono)" }}
										>
											{formatCents(bid.amountCents)}
										</span>
										<span className="text-xs text-[var(--ink-subtle)] hidden sm:block w-32 text-right">
											{new Date(bid.placedAt).toLocaleString("pt-BR", {
												day: "2-digit", month: "short",
												hour: "2-digit", minute: "2-digit",
											})}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
