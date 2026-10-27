import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lots, bids, wallet } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

function splitMs(ms: number): {
	dias: string;
	hr: string;
	min: string;
	seg: string;
} {
	const total = Math.floor(ms / 1000);
	return {
		dias: String(Math.floor(total / 86400)).padStart(2, "0"),
		hr: pad(Math.floor((total % 86400) / 3600)),
		min: pad(Math.floor((total % 3600) / 60)),
		seg: pad(total % 60),
	};
}

function CountdownBox({
	value,
	label,
	urgent,
}: {
	value: string;
	label: string;
	urgent: boolean;
}) {
	return (
		<div className="flex flex-col items-center bg-[#f2f4f7] rounded-lg py-3 px-1 min-w-0">
			<span
				className="text-2xl font-bold tabular-nums leading-none"
				style={{ color: urgent ? "#c0392b" : "#0a0a0a" }}
			>
				{value}
			</span>
			<span className="text-[9px] uppercase tracking-widest text-[#9ca3af] mt-1.5">
				{label}
			</span>
		</div>
	);
}

function SegmentedCountdown({ ms, urgent }: { ms: number; urgent: boolean }) {
	const { dias, hr, min, seg } = splitMs(ms);
	return (
		<div className="grid grid-cols-4 gap-1.5">
			<CountdownBox value={dias} label="DIAS" urgent={urgent} />
			<CountdownBox value={hr} label="HR" urgent={urgent} />
			<CountdownBox value={min} label="MIN" urgent={urgent} />
			<CountdownBox value={seg} label="SEG" urgent={urgent} />
		</div>
	);
}

const BID_ERROR_MESSAGES: Record<string, string> = {
	ALREADY_LEADING: "Você já está liderando este lote",
	BID_TOO_LOW: "Lance abaixo do mínimo permitido",
	INSUFFICIENT_BALANCE: "Saldo insuficiente — deposite mais na carteira",
	LOT_NOT_LIVE: "Lote não está ao vivo",
};

function friendlyBidError(raw: string): string {
	for (const [code, msg] of Object.entries(BID_ERROR_MESSAGES)) {
		if (raw.includes(code)) return msg;
	}
	return raw;
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
			setBidError(
				friendlyBidError(
					err instanceof Error ? err.message : "Erro ao dar lance",
				),
			);
		} finally {
			setPlacing(false);
		}
	}

	if (!lot)
		return (
			<div className="flex items-center justify-center h-64 text-[#6b6b6b] text-sm">
				Carregando…
			</div>
		);

	const minNext = lot.currentBidCents
		? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
		: Number(lot.startingBidCents);

	return (
		<div className="max-w-6xl">
			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-xs text-[#9ca3af] mb-5">
				<Link to="/lots" className="hover:text-[#0a0a0a]">
					Leilões
				</Link>
				<span>/</span>
				<span className="text-[#6b6b6b] line-clamp-1">{lot.title}</span>
			</div>

			{/* Two-column grid */}
			<div className="grid lg:grid-cols-[3fr_2fr] gap-8 items-start">
				{/* LEFT column */}
				<div className="space-y-6">
					{/* Image */}
					<div
						className="w-full bg-[#f2f4f7] rounded-xl overflow-hidden"
						style={{ aspectRatio: "4/3" }}
					>
						{lot.imageUrl ? (
							<img
								src={lot.imageUrl}
								alt={lot.title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<svg
									width="64"
									height="64"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#d1d5db"
									strokeWidth="1"
								>
									<rect x="3" y="3" width="18" height="18" rx="2" />
									<circle cx="8.5" cy="8.5" r="1.5" />
									<path d="m21 15-5-5L5 21" />
								</svg>
							</div>
						)}
					</div>

					{/* Title + category */}
					<div>
						<p className="text-xs font-medium uppercase tracking-widest text-[#9ca3af] mb-2">
							{lot.category.replace(/_/g, " ")}
						</p>
						<h1 className="font-serif text-3xl font-bold text-[#0a0a0a] leading-tight">
							{lot.title}
						</h1>
					</div>

					{/* Description */}
					{lot.description && (
						<div className="text-sm text-[#6b6b6b] leading-relaxed border-t border-[#f0f0f0] pt-4">
							{lot.description}
						</div>
					)}

					{/* Bid history */}
					<div className="bg-white border border-[#e6e6e6] rounded-xl p-5">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-sm font-semibold text-[#0a0a0a]">
								Histórico de lances{" "}
								<span className="text-[#9ca3af] font-normal">
									({liveBids.length})
								</span>
							</h2>
							<Link
								to={`/audit/${lot.id}`}
								className="text-xs text-[#9ca3af] hover:text-[#0a0a0a] underline"
							>
								Verificar cadeia →
							</Link>
						</div>

						{liveBids.length === 0 ? (
							<p className="text-sm text-[#9ca3af]">Nenhum lance ainda.</p>
						) : (
							<div className="space-y-0">
								{[...liveBids].reverse().map((bid) => (
									<div
										key={bid.id}
										className="flex justify-between items-center py-2.5 border-b border-[#f0f0f0] last:border-0 text-sm"
									>
										<span className="text-[#6b6b6b]">{bid.pseudonym}</span>
										<span className="font-semibold font-mono tabular-nums text-[#0a0a0a]">
											{formatCents(bid.amountCents)}
										</span>
										<span className="text-xs text-[#9ca3af]">
											{new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* RIGHT column — sticky bid panel */}
				<div className="lg:sticky lg:top-6 space-y-4">
					{/* Status badge */}
					<div>
						{isLive ? (
							<span
								className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
								style={{ background: "#1d5fbf", color: "#fff" }}
							>
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
								AO VIVO
							</span>
						) : (
							<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#f0f0f0] text-[#6b6b6b]">
								{lot.status === "SCHEDULED"
									? "AGENDADO"
									: lot.status === "CLOSED"
										? "ENCERRADO"
										: lot.status}
							</span>
						)}
					</div>

					{/* Countdown */}
					{isLive && remaining > 0 ? (
						<div>
							<p className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2">
								Encerra em
							</p>
							<SegmentedCountdown ms={remaining} urgent={isUrgent} />
						</div>
					) : (
						<div className="bg-[#f2f4f7] rounded-lg px-4 py-3">
							<p className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-1">
								{lot.status === "CLOSED" ? "Encerrado em" : "Previsto para"}
							</p>
							<p className="text-sm font-semibold text-[#0a0a0a]">
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

					{/* Current bid */}
					<div className="bg-white border border-[#e6e6e6] rounded-xl p-5">
						<p className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2">
							Lance atual
						</p>
						<p
							className="text-4xl font-bold tabular-nums leading-none"
							style={{ color: "#1d5fbf" }}
						>
							{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
						</p>
						<p className="text-xs text-[#9ca3af] mt-2">
							{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"} ·{" "}
							Incremento mínimo {formatCents(lot.minIncrementCents)}
						</p>
					</div>

					{/* Position pill (BIDDER only, LIVE) */}
					{user?.role === "BIDDER" && isLive && position && (
						<div
							className={`rounded-lg border px-4 py-3 text-sm font-medium ${
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
						<div className="bg-white border border-[#e6e6e6] rounded-xl p-5 space-y-3">
							{balance && (
								<div className="flex justify-between text-xs text-[#9ca3af]">
									<span>
										Disponível:{" "}
										<span className="font-semibold text-[#0a0a0a]">
											{formatCents(balance.availableCents)}
										</span>
									</span>
									<span>
										Mínimo:{" "}
										<span className="font-semibold text-[#0a0a0a]">
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
								<p className="text-sm text-[#c0392b] bg-red-50 border border-red-200 rounded px-3 py-2">
									{bidError}
								</p>
							)}
						</div>
					)}

					{/* Not logged in prompt */}
					{!user && isLive && (
						<Link
							to="/login"
							className="block text-center w-full bg-[#141414] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
						>
							Entrar para dar lance
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
