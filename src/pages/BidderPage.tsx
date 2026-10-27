import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { wallet, users, lots, imgProxy } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { translateError } from "@/lib/errors";

function formatCents(cents: string | number | null | undefined): string {
	if (cents === null || cents === undefined) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function timeLeft(endsAt: string): string {
	const diff = new Date(endsAt).getTime() - Date.now();
	if (diff <= 0) return "Encerrado";
	const h = Math.floor(diff / 3_600_000);
	const m = Math.floor((diff % 3_600_000) / 60_000);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}

export function BidderPage() {
	const user = useAuthStore((s) => s.user);
	const qc = useQueryClient();

	const [depositAmount, setDepositAmount] = useState("");
	const [depositError, setDepositError] = useState<string | null>(null);
	const [depositSuccess, setDepositSuccess] = useState(false);
	const [depositOpen, setDepositOpen] = useState(false);

	const { data: balance } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
	});

	const { data: bidsData } = useQuery({
		queryKey: ["my-bids"],
		queryFn: () => users.myBids(),
	});

	const { data: wins } = useQuery({
		queryKey: ["my-wins"],
		queryFn: () => users.myWins(),
	});

	const { data: liveLots } = useQuery({
		queryKey: ["lots-live"],
		queryFn: () => lots.list({ status: "LIVE" }),
	});

	// Lots where this bidder has placed a bid and are still LIVE
	const activeBidLotIds = new Set(
		(bidsData?.items ?? []).map((b) => b.lotId).filter(Boolean),
	);
	const activeBidLots = (liveLots?.items ?? []).filter((l) =>
		activeBidLotIds.has(l.id),
	);

	const totalSpent = (wins ?? []).reduce(
		(s, w) => s + Number(w.amountCents),
		0,
	);

	const depositMutation = useMutation({
		mutationFn: async () => {
			const cents = Math.round(parseFloat(depositAmount) * 100);
			await wallet.deposit(cents);
		},
		onSuccess: () => {
			setDepositAmount("");
			setDepositSuccess(true);
			setDepositOpen(false);
			void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
			void qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
		},
		onError: (err) => {
			setDepositError(translateError(err));
		},
	});

	return (
		<div className="min-h-screen bg-[#F5F4F0]">
			{/* Header */}
			<div className="bg-white border-b border-[#E4E4E2]">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-start justify-between gap-4 flex-wrap">
						<div>
							<p className="text-xs text-[#9CA3AF] font-medium tracking-wider uppercase mb-1">
								Painel do Licitante
							</p>
							<h1
								className="text-2xl font-bold text-[#0D0D0D]"
								style={{ fontFamily: "var(--font-display)" }}
							>
								Olá, {user?.name?.split(" ")[0] ?? "Licitante"}
							</h1>
						</div>

						{/* Balance highlight */}
						<div className="flex items-center gap-3">
							<div className="text-right">
								<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider">
									Saldo disponível
								</p>
								<p
									className="text-2xl font-bold tabular-nums"
									style={{
										color: "#1D4ED8",
										fontFamily: "var(--font-mono)",
									}}
								>
									{balance ? formatCents(balance.availableCents) : "—"}
								</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setDepositOpen((v) => !v);
									setDepositSuccess(false);
									setDepositError(null);
								}}
								className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
								style={{ background: depositOpen ? "#374151" : "#1D4ED8" }}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									aria-hidden
								>
									{depositOpen ? (
										<path d="M18 6L6 18M6 6l12 12" />
									) : (
										<path d="M12 5v14M5 12h14" />
									)}
								</svg>
								{depositOpen ? "Fechar" : "Depositar"}
							</button>
						</div>
					</div>

					{/* Deposit form */}
					{depositOpen && (
						<div className="mt-4 pt-4 border-t border-[#F3F4F6]">
							<div className="flex gap-3 max-w-sm">
								<Input
									type="number"
									step="0.01"
									min="1"
									placeholder="Valor em R$"
									value={depositAmount}
									onChange={(e) => setDepositAmount(e.target.value)}
									className="flex-1"
								/>
								<Button
									onClick={() => {
										setDepositError(null);
										depositMutation.mutate();
									}}
									disabled={depositMutation.isPending || !depositAmount}
								>
									{depositMutation.isPending ? "…" : "Confirmar"}
								</Button>
							</div>
							{depositSuccess && (
								<p className="mt-2 text-xs text-green-700">
									Depósito realizado com sucesso!
								</p>
							)}
							{depositError && (
								<p className="mt-2 text-xs text-[#DC2626]">{depositError}</p>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
				{/* Stats */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
						<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">
							Arremates
						</p>
						<p className="text-3xl font-bold text-[#1D4ED8] tabular-nums">
							{wins?.length ?? 0}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
						<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">
							Lances ativos
						</p>
						<p className="text-3xl font-bold text-[#DC2626] tabular-nums">
							{activeBidLots.length}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
						<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">
							Total gasto
						</p>
						<p className="text-lg font-bold text-[#0D0D0D] tabular-nums leading-tight mt-1">
							{formatCents(String(totalSpent))}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4">
						<p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">
							Reservado
						</p>
						<p className="text-lg font-bold text-[#9CA3AF] tabular-nums leading-tight mt-1">
							{balance ? formatCents(balance.committedCents) : "—"}
						</p>
					</div>
				</div>

				{/* Active bids */}
				<div className="bg-white rounded-xl border border-[#E4E4E2] overflow-hidden">
					<div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
						<h2 className="text-base font-semibold text-[#0D0D0D]">
							Lances ativos
							{activeBidLots.length > 0 && (
								<span className="ml-2 text-sm font-normal text-[#9CA3AF]">
									{activeBidLots.length}
								</span>
							)}
						</h2>
						<Link
							to="/?status=LIVE"
							className="text-xs text-[#1D4ED8] hover:underline font-medium"
						>
							Ver todos ao vivo →
						</Link>
					</div>

					{activeBidLots.length === 0 ? (
						<div className="px-6 py-12 text-center">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#D1D5DB"
								strokeWidth="1.5"
								className="mx-auto mb-3"
								aria-hidden
							>
								<circle cx="12" cy="12" r="3" />
								<path d="M5.6 5.6a9 9 0 0 0 0 12.8" />
								<path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
							</svg>
							<p className="text-sm text-[#9CA3AF]">Nenhum lance ativo.</p>
							<Link
								to="/?status=LIVE"
								className="mt-2 inline-block text-sm text-[#1D4ED8] hover:underline font-medium"
							>
								Ver leilões ao vivo →
							</Link>
						</div>
					) : (
						<div className="divide-y divide-[#F3F4F6]">
							{activeBidLots.map((lot) => {
								const proxyUrl = imgProxy(lot.imageUrl);
								const isLeading =
									lot.currentBidCents !== null &&
									bidsData?.items.some(
										(b) =>
											b.lotId === lot.id &&
											b.amountCents === lot.currentBidCents,
									);
								return (
									<div
										key={lot.id}
										className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
									>
										<div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[#F5F4F0]">
											{proxyUrl ? (
												<img
													src={proxyUrl}
													alt={lot.title}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="#D1D5DB"
														strokeWidth="1.5"
														aria-hidden
													>
														<rect x="3" y="3" width="18" height="18" rx="2" />
														<circle cx="8.5" cy="8.5" r="1.5" />
														<path d="m21 15-5-5L5 21" />
													</svg>
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<Link
												to={`/lots/${lot.id}`}
												className="text-sm font-semibold text-[#0D0D0D] hover:text-[#1D4ED8] transition-colors line-clamp-1"
											>
												{lot.title}
											</Link>
											<div className="flex items-center gap-3 mt-0.5">
												<span
													className="text-sm font-bold tabular-nums"
													style={{
														color: "#1D4ED8",
														fontFamily: "var(--font-mono)",
													}}
												>
													{formatCents(
														lot.currentBidCents ?? lot.startingBidCents,
													)}
												</span>
												<span className="text-xs text-[#9CA3AF]">
													{lot.bidCount} lance{lot.bidCount !== 1 ? "s" : ""}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2.5 flex-shrink-0">
											{isLeading ? (
												<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
													<svg
														width="9"
														height="9"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														aria-hidden
													>
														<path d="M20 6L9 17l-5-5" />
													</svg>
													Liderando
												</span>
											) : (
												<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706]">
													Superado
												</span>
											)}
											<span className="text-xs text-[#9CA3AF] tabular-nums w-14 text-right">
												{timeLeft(lot.endsAt)}
											</span>
											<Link
												to={`/lots/${lot.id}`}
												className="text-xs font-medium text-[#1D4ED8] hover:underline"
											>
												Licitar →
											</Link>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Recent wins */}
				{wins && wins.length > 0 && (
					<div className="bg-white rounded-xl border border-[#E4E4E2] overflow-hidden">
						<div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
							<h2 className="text-base font-semibold text-[#0D0D0D]">
								Arremates
								<span className="ml-2 text-sm font-normal text-[#9CA3AF]">
									{wins.length}
								</span>
							</h2>
							<Link
								to="/activity"
								className="text-xs text-[#1D4ED8] hover:underline font-medium"
							>
								Ver histórico completo →
							</Link>
						</div>
						<div className="divide-y divide-[#F3F4F6]">
							{wins.slice(0, 5).map((win) => (
								<div
									key={win.lotId}
									className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors"
								>
									<Link
										to={`/lots/${win.lotId}`}
										className="text-sm font-semibold text-[#0D0D0D] hover:text-[#1D4ED8] transition-colors"
									>
										Lote #{win.lotId.slice(-8).toUpperCase()}
									</Link>
									<div className="flex items-center gap-3">
										<span
											className="text-sm font-bold tabular-nums"
											style={{
												color: "#1D4ED8",
												fontFamily: "var(--font-mono)",
											}}
										>
											{formatCents(win.amountCents)}
										</span>
										<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
											Arrematado
										</span>
										{win.receiptToken && (
											<Link
												to={`/receipt/${win.receiptToken}`}
												className="text-xs text-[#1D4ED8] hover:underline"
											>
												Comprovante
											</Link>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Quick links */}
				<div className="grid grid-cols-2 gap-4">
					<Link
						to="/wallet"
						className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4 flex items-center gap-3 hover:border-[#1D4ED8] transition-colors group"
					>
						<div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#1D4ED8"
								strokeWidth="1.8"
								aria-hidden
							>
								<rect x="2" y="5" width="20" height="14" rx="2" />
								<path d="M2 10h20" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-semibold text-[#0D0D0D] group-hover:text-[#1D4ED8] transition-colors">
								Minha Carteira
							</p>
							<p className="text-xs text-[#9CA3AF]">Extrato e depósitos</p>
						</div>
					</Link>
					<Link
						to="/activity"
						className="bg-white rounded-xl border border-[#E4E4E2] px-5 py-4 flex items-center gap-3 hover:border-[#1D4ED8] transition-colors group"
					>
						<div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#1D4ED8"
								strokeWidth="1.8"
								aria-hidden
							>
								<path d="M12 20h9" />
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-semibold text-[#0D0D0D] group-hover:text-[#1D4ED8] transition-colors">
								Minha Atividade
							</p>
							<p className="text-xs text-[#9CA3AF]">Histórico de lances</p>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}
