import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { audit } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function truncateHash(hash: string | null | undefined, len = 12): string {
	if (!hash) return "-";
	return `${hash.slice(0, len)}…${hash.slice(-6)}`;
}

export function AuditPage() {
	const { lotId } = useParams<{ lotId: string }>();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: result, isLoading: loadingResult } = useQuery({
		queryKey: ["audit", lotId],
		queryFn: () => audit.getLot(lotId!),
		enabled: !!lotId,
	});

	const { data: bidList, isLoading: loadingBids } = useQuery({
		queryKey: ["audit-bids", lotId],
		queryFn: () => audit.getBids(lotId!),
		enabled: !!lotId,
	});

	const isLoading = loadingResult || loadingBids;

	return (
		<div style={{ background: "var(--ground)", minHeight: "100vh" }}>
			<div style={{ height: "var(--header-h, 152px)" }} aria-hidden />

			<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
				{/* Back */}
				<Link
					to={`/lots/${lotId}`}
					className="inline-flex items-center gap-1.5 text-sm transition-colors"
					style={{ color: "var(--ink-muted)" }}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M19 12H5M12 5l-7 7 7 7" />
					</svg>
					Voltar ao lote
				</Link>

				{/* Title */}
				<div>
					<h1
						className="text-2xl font-bold"
						style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
					>
						Auditoria de Lances
					</h1>
					<p className="text-xs mt-1 font-mono" style={{ color: "var(--ink-subtle)" }}>
						lote: {lotId}
					</p>
				</div>

				{isLoading && (
					<div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-muted)" }}>
						<svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M21 12a9 9 0 11-6.219-8.56" />
						</svg>
						Verificando cadeia criptográfica…
					</div>
				)}

				{/* Chain verification result */}
				{result && (
					<div
						className="rounded-2xl p-6 border"
						style={{
							background: result.chainValid ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
							borderColor: result.chainValid ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)",
						}}
					>
						<div className="flex items-start gap-4">
							{/* Icon */}
							<div
								className="w-12 h-12 rounded-full flex items-center justify-center flex-none"
								style={{
									background: result.chainValid ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
								}}
							>
								{result.chainValid ? (
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
										<path d="M20 6L9 17l-5-5" />
									</svg>
								) : (
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								)}
							</div>

							<div className="flex-1 min-w-0">
								<p
									className="text-lg font-bold"
									style={{
										color: result.chainValid ? "var(--positive)" : "var(--live)",
										fontFamily: "var(--font-display)",
									}}
								>
									{result.chainValid ? "Cadeia íntegra e verificada" : "Cadeia corrompida"}
								</p>
								<p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
									{result.chainValid
										? "Todos os lances formam uma cadeia hash contínua e imutável. Nenhuma adulteração detectada."
										: "A sequência de hashes está quebrada. A integridade dos lances pode estar comprometida."}
								</p>

								{/* Stats row */}
								<div className="flex flex-wrap gap-4 mt-4">
									<div>
										<p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-subtle)" }}>
											Total de lances
										</p>
										<p className="text-xl font-bold tabular-nums" style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
											{result.bidCount}
										</p>
									</div>
									{result.firstHash && (
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-subtle)" }}>
												Hash inicial
											</p>
											<code className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
												{truncateHash(result.firstHash)}
											</code>
										</div>
									)}
									{result.lastHash && (
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-subtle)" }}>
												Hash final
											</p>
											<code className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
												{truncateHash(result.lastHash)}
											</code>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Full hashes collapsed */}
						{(result.firstHash || result.lastHash) && (
							<div
								className="mt-5 pt-4 grid gap-2"
								style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
							>
								{result.firstHash && (
									<div className="flex items-start gap-2">
										<span className="text-[10px] uppercase tracking-widest shrink-0 pt-0.5 w-20" style={{ color: "var(--ink-subtle)" }}>
											1º hash
										</span>
										<code className="text-[11px] font-mono break-all" style={{ color: "var(--ink-muted)" }}>
											{result.firstHash}
										</code>
									</div>
								)}
								{result.lastHash && (
									<div className="flex items-start gap-2">
										<span className="text-[10px] uppercase tracking-widest shrink-0 pt-0.5 w-20" style={{ color: "var(--ink-subtle)" }}>
											Último
										</span>
										<code className="text-[11px] font-mono break-all" style={{ color: "var(--ink-muted)" }}>
											{result.lastHash}
										</code>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Bid sequence */}
				{bidList && bidList.length > 0 && (
					<div
						className="rounded-2xl border overflow-hidden"
						style={{ background: "var(--surface)", borderColor: "var(--border)" }}
					>
						<div
							className="px-5 py-4 flex items-center justify-between border-b"
							style={{ borderColor: "var(--border)" }}
						>
							<h2
								className="text-sm font-semibold"
								style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
							>
								Sequência completa de lances
							</h2>
							<span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--subtle-bg2)", color: "var(--ink-muted)" }}>
								{bidList.length} {bidList.length === 1 ? "lance" : "lances"}
							</span>
						</div>

						<div>
							{bidList.map((bid, idx) => {
								const isExpanded = expandedId === bid.id;
								const isLast = idx === bidList.length - 1;
								return (
									<div
										key={bid.id}
										className="cursor-pointer transition-colors"
										style={{
											borderBottom: isLast ? "none" : `1px solid var(--border)`,
											background: isExpanded ? "var(--subtle-bg)" : "transparent",
										}}
										onClick={() => setExpandedId(isExpanded ? null : bid.id)}
									>
										<div className="px-5 py-3.5 flex items-center gap-4">
											{/* Sequence */}
											<span
												className="text-[11px] font-mono w-8 shrink-0 text-center rounded-md py-0.5"
												style={{ background: "var(--subtle-bg2)", color: "var(--ink-subtle)" }}
											>
												#{String(bid.sequence).padStart(2, "0")}
											</span>

											{/* Pseudonym */}
											<span
												className="text-sm font-mono flex-1 truncate"
												style={{ color: "var(--ink-muted)" }}
											>
												{bid.pseudonym}
											</span>

											{/* Date */}
											<span
												className="text-xs hidden sm:block shrink-0"
												style={{ color: "var(--ink-subtle)" }}
											>
												{new Date(bid.placedAt).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>

											{/* Amount */}
											<span
												className="text-sm font-semibold tabular-nums font-mono shrink-0"
												style={{ color: "var(--accent)" }}
											>
												{formatCents(bid.amountCents)}
											</span>

											{/* Expand chevron */}
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												style={{
													color: "var(--ink-subtle)",
													transition: "transform 0.2s",
													transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
													flexShrink: 0,
												}}
											>
												<path d="M6 9l6 6 6-6" />
											</svg>
										</div>

										{/* Expanded: full ID + date */}
										{isExpanded && (
											<div
												className="px-5 pb-4 pt-1 space-y-2"
												style={{ borderTop: `1px solid var(--border)` }}
											>
												<div className="flex items-start gap-3">
													<span className="text-[10px] uppercase tracking-widest shrink-0 pt-0.5 w-16" style={{ color: "var(--ink-subtle)" }}>
														ID
													</span>
													<code className="text-[11px] font-mono break-all" style={{ color: "var(--ink-muted)" }}>
														{bid.id}
													</code>
												</div>
												<div className="flex items-center gap-3">
													<span className="text-[10px] uppercase tracking-widest shrink-0 w-16" style={{ color: "var(--ink-subtle)" }}>
														Data/hora
													</span>
													<code className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>
														{new Date(bid.placedAt).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
															second: "2-digit",
														})}
													</code>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{bidList?.length === 0 && !isLoading && (
					<div
						className="rounded-2xl border p-10 text-center"
						style={{ background: "var(--surface)", borderColor: "var(--border)" }}
					>
						<p className="text-sm" style={{ color: "var(--ink-muted)" }}>
							Nenhum lance registrado neste lote.
						</p>
					</div>
				)}

				{/* What is this? */}
				<div
					className="rounded-xl border p-5 space-y-2"
					style={{ background: "var(--subtle-bg)", borderColor: "var(--border)" }}
				>
					<p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
						O que é esta auditoria?
					</p>
					<p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
						Cada lance registrado gera um hash criptográfico que encadeia o lance anterior.
						Qualquer alteração retroativa quebra a cadeia e é detectada imediatamente.
						Esta página permite que qualquer pessoa verifique a integridade do histórico de lances de forma independente.
					</p>
				</div>
			</div>
		</div>
	);
}
