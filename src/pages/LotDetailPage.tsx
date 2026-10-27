import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lots, bids, wallet } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { translateError } from "@/lib/errors";
import type { Bid } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function useCountdownMs(endsAt: string | undefined): number {
	const [remaining, setRemaining] = useState(0);
	useEffect(() => {
		if (!endsAt) return;
		const update = () =>
			setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [endsAt]);
	return remaining;
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

function splitMs(ms: number) {
	const total = Math.floor(ms / 1000);
	return {
		dias: String(Math.floor(total / 86400)).padStart(2, "0"),
		hr: pad(Math.floor((total % 86400) / 3600)),
		min: pad(Math.floor((total % 3600) / 60)),
		seg: pad(total % 60),
	};
}

function CountdownBanner({ ms, urgent }: { ms: number; urgent: boolean }) {
	const { dias, hr, min, seg } = splitMs(ms);
	return (
		<div className="flex items-center gap-1">
			{[
				{ v: dias, l: "DIAS" },
				{ v: hr, l: "HR" },
				{ v: min, l: "MIN" },
				{ v: seg, l: "SEG" },
			].map(({ v, l }, i) => (
				<div key={l}>
					<div className="flex items-center gap-1">
						{i > 0 && (
							<span
								className="text-xl font-bold"
								style={{ color: urgent ? "#DC2626" : "#0D0D0D" }}
							>
								:
							</span>
						)}
						<div className="flex flex-col items-center">
							<span
								className="text-2xl font-bold tabular-nums leading-none"
								style={{ color: urgent ? "#DC2626" : "#0D0D0D" }}
							>
								{v}
							</span>
							<span className="text-[9px] uppercase tracking-widest text-[#9CA3AF]">
								{l}
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function LotGallery({
	mainImage,
	additionalImages,
	title,
}: {
	mainImage: string | null;
	additionalImages: string[];
	title: string;
}) {
	const allImages = [mainImage, ...additionalImages].filter((u): u is string => Boolean(u));
	const [activeIdx, setActiveIdx] = useState(0);
	const active = allImages[activeIdx] ?? null;

	return (
		<div className="space-y-2">
			<div className="rounded-xl overflow-hidden bg-[#F5F4F0]" style={{ aspectRatio: "4/3" }}>
				{active ? (
					<img src={active} alt={title} className="w-full h-full object-contain" />
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1">
							<rect x="3" y="3" width="18" height="18" rx="2"/>
							<circle cx="8.5" cy="8.5" r="1.5"/>
							<path d="m21 15-5-5L5 21"/>
						</svg>
					</div>
				)}
			</div>
			{allImages.length > 1 && (
				<div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
					{allImages.map((url, i) => (
						<button
							key={i}
							type="button"
							onClick={() => setActiveIdx(i)}
							className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
							style={{ borderColor: i === activeIdx ? "#1D4ED8" : "transparent" }}
						>
							<img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function LotDetailPage() {
	const { id } = useParams<{ id: string }>();
	const user = useAuthStore((s) => s.user);
	const qc = useQueryClient();
	const [bidAmount, setBidAmount] = useState("");
	const [bidError, setBidError] = useState<string | null>(null);
	const [placing, setPlacing] = useState(false);
	const [liveBids, setLiveBids] = useState<Bid[]>([]);
	const sseRef = useRef<EventSource | null>(null);

	const { data: lot } = useQuery({
		queryKey: ["lot", id],
		queryFn: () => lots.get(id!),
		refetchInterval: 10_000,
		enabled: !!id,
	});

	const remaining = useCountdownMs(lot?.endsAt);
	const isUrgent = remaining > 0 && remaining < 2 * 60 * 1000;
	const isLive = lot?.status === "LIVE";

	const { data: initialBids } = useQuery({
		queryKey: ["bids", id],
		queryFn: () => bids.list(id!),
		enabled: !!id,
	});

	useEffect(() => {
		if (initialBids) setLiveBids(initialBids);
	}, [initialBids]);

	useEffect(() => {
		if (!id || lot?.status !== "LIVE") return;
		const es = new EventSource(`/api/lots/${id}/bids/events`, {
			withCredentials: true,
		});
		es.onmessage = (e: MessageEvent<string>) => {
			const bid = JSON.parse(e.data) as Bid;
			setLiveBids((prev) => [...prev, bid]);
			void qc.invalidateQueries({ queryKey: ["lot", id] });
			void qc.invalidateQueries({ queryKey: ["position", id] });
		};
		sseRef.current = es;
		return () => {
			es.close();
			sseRef.current = null;
		};
	}, [id, lot?.status, qc]);

	const { data: balance } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
		enabled: !!user && user.role === "BIDDER",
	});

	const { data: position } = useQuery({
		queryKey: ["position", id],
		queryFn: () => lots.getPosition(id!),
		enabled: !!id && !!user && user.role === "BIDDER" && lot?.status === "LIVE",
		refetchInterval: 10_000,
	});

	async function handlePlaceBid(e: React.FormEvent) {
		e.preventDefault();
		if (!id) return;
		setBidError(null);
		setPlacing(true);
		try {
			const cents = Math.round(parseFloat(bidAmount) * 100);
			await bids.place(id, cents);
			setBidAmount("");
			void qc.invalidateQueries({ queryKey: ["lot", id] });
			void qc.invalidateQueries({ queryKey: ["position", id] });
			void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
		} catch (err) {
			setBidError(translateError(err));
		} finally {
			setPlacing(false);
		}
	}

	if (!lot)
		return (
			<div className="flex items-center justify-center h-64 text-[#6B7280] text-sm">
				Carregando…
			</div>
		);

	const minNext = lot.currentBidCents
		? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
		: Number(lot.startingBidCents);

	return (
		<div className="bg-white">
			{/* Top bar: breadcrumb + countdown */}
			<div className="border-b border-[#E4E4E2] bg-white sticky top-[130px] z-10">
				<div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
					<nav className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
						<Link to="/" className="hover:text-[#0D0D0D]">Leilões</Link>
						<span>/</span>
						<span className="text-[#6B7280] truncate max-w-xs">{lot.title}</span>
					</nav>
					{isLive && remaining > 0 && (
						<div className="flex items-center gap-3">
							<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#DC2626] uppercase">
								<span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
								Ao vivo
							</span>
							<CountdownBanner ms={remaining} urgent={isUrgent} />
						</div>
					)}
					{!isLive && (
						<span className="text-xs text-[#9CA3AF]">
							{lot.status === "CLOSED" ? "Encerrado" : "Agendado"}
						</span>
					)}
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Title row */}
				<div className="mb-6">
					<p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h1
						className="text-2xl md:text-3xl font-bold text-[#0D0D0D] leading-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h1>
				</div>

				{/* Two columns */}
				<div className="grid lg:grid-cols-[3fr_2fr] gap-8 items-start">
					{/* LEFT */}
					<div className="space-y-6">
						{/* Image gallery */}
						<LotGallery
							mainImage={lot.imageUrl}
							additionalImages={lot.additionalImages ?? []}
							title={lot.title}
						/>

						{/* Description */}
						{lot.description && (
							<div className="bg-white border border-[#E4E4E2] rounded-xl p-5">
								<h2 className="text-sm font-semibold text-[#0D0D0D] mb-3">
									Descrição
								</h2>
								<p className="text-sm text-[#6B7280] leading-relaxed">
									{lot.description}
								</p>
							</div>
						)}

						{/* Bid history */}
						<div className="bg-white border border-[#E4E4E2] rounded-xl p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-sm font-semibold text-[#0D0D0D]">
									Histórico de lances{" "}
									<span className="text-[#9CA3AF] font-normal">
										({liveBids.length})
									</span>
								</h2>
								<Link
									to={`/audit/${lot.id}`}
									className="text-xs text-[#9CA3AF] hover:text-[#0D0D0D] underline"
								>
									Verificar cadeia →
								</Link>
							</div>

							{liveBids.length === 0 ? (
								<p className="text-sm text-[#9CA3AF]">Nenhum lance ainda.</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-[#F0F0EE]">
											<th className="text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider pb-2">Licitante</th>
											<th className="text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider pb-2">Valor</th>
											<th className="text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider pb-2">Horário</th>
										</tr>
									</thead>
									<tbody>
										{[...liveBids].reverse().map((bid, i) => (
											<tr
												key={bid.id}
												className="border-b border-[#F9F9F9] last:border-0"
											>
												<td className="py-2.5 text-[#6B7280]">
													{i === 0 && (
														<span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] mr-1.5" />
													)}
													{bid.pseudonym}
												</td>
												<td className="py-2.5 text-right font-semibold tabular-nums text-[#0D0D0D]" style={{ fontFamily: "var(--font-mono)" }}>
													{formatCents(bid.amountCents)}
												</td>
												<td className="py-2.5 text-right text-xs text-[#9CA3AF]">
													{new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* RIGHT sticky panel */}
					<div className="lg:sticky lg:top-[160px] space-y-4">
						{/* Current bid card */}
						<div className="bg-white border border-[#E4E4E2] rounded-xl p-5">
							<p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1">
								Licitação atual
							</p>
							<p
								className="text-4xl font-bold tabular-nums leading-none mb-1"
								style={{ color: "#1D4ED8", fontFamily: "var(--font-mono)" }}
							>
								{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
							</p>
							<p className="text-xs text-[#9CA3AF]">
								{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"} ·{" "}
								Incremento mínimo {formatCents(lot.minIncrementCents)}
							</p>
						</div>

						{/* Position pill (BIDDER only, LIVE) */}
						{user?.role === "BIDDER" && isLive && position && (
							<div
								className={`rounded-xl border px-4 py-3 text-sm font-medium ${
									position.isLeading
										? "border-green-600/30 bg-green-50 text-green-800"
										: "border-orange-500/30 bg-orange-50 text-orange-800"
								}`}
							>
								{position.isLeading ? (
									<span>✓ Você está liderando</span>
								) : (
									<span>
										Você foi superado —{" "}
										{position.gapToLeadCents
											? `faltam ${formatCents(position.gapToLeadCents)}`
											: "dê um lance para participar"}
									</span>
								)}
							</div>
						)}

						{/* Bid form (BIDDER + LIVE) */}
						{user?.role === "BIDDER" && isLive && (
							<div className="bg-white border border-[#E4E4E2] rounded-xl p-5 space-y-3">
								{balance && (
									<div className="flex justify-between text-xs text-[#9CA3AF]">
										<span>
											Disponível:{" "}
											<span className="font-semibold text-[#0D0D0D]">
												{formatCents(balance.availableCents)}
											</span>
										</span>
										<span>
											Mínimo:{" "}
											<span className="font-semibold text-[#0D0D0D]">
												{formatCents(String(minNext))}
											</span>
										</span>
									</div>
								)}
								<form onSubmit={handlePlaceBid} className="flex gap-2">
									<Input
										type="number"
										step="0.01"
										min={(minNext / 100).toFixed(2)}
										placeholder={`Mín. R$ ${(minNext / 100).toFixed(2)}`}
										value={bidAmount}
										onChange={(e) => setBidAmount(e.target.value)}
										required
										className="flex-1"
									/>
									<Button type="submit" disabled={placing}>
										{placing ? "…" : "Lançar"}
									</Button>
								</form>
								{bidError && (
									<p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">
										{bidError}
									</p>
								)}
							</div>
						)}

						{/* Status panel for non-LIVE */}
						{!isLive && (
							<div className="bg-[#F9F9F7] border border-[#E4E4E2] rounded-xl p-5">
								<p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1">
									{lot.status === "CLOSED" ? "Encerrado em" : "Previsto para"}
								</p>
								<p className="text-sm font-semibold text-[#0D0D0D]">
									{new Date(lot.endsAt).toLocaleString("pt-BR", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						)}

						{/* Not logged in prompt */}
						{!user && isLive && (
							<Link
								to="/login"
								className="block text-center w-full bg-[#0D0D0D] text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-[#1D4ED8] transition-colors duration-200"
							>
								Entrar para dar lance
							</Link>
						)}

						{/* Trust badges */}
						<div className="bg-white border border-[#E4E4E2] rounded-xl p-4">
							<div className="flex items-start gap-3 text-xs text-[#6B7280]">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" className="mt-0.5 flex-none">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
								</svg>
								<div>
									<p className="font-semibold text-[#0D0D0D] mb-0.5">Proteção do comprador</p>
									<p>Todos os lances são auditáveis com hash chain criptográfico. Integridade garantida.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
