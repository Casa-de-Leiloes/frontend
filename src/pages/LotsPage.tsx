import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots } from "@/lib/api";
import type { Lot } from "@/lib/api";

type StatusFilter = "ALL" | "LIVE" | "SCHEDULED" | "CLOSED";

function IconGrid({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<rect x="0" y="0" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="7.5" y="0" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="0" y="7.5" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill={color} />
		</svg>
	);
}

function IconClock({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<circle cx="6.5" cy="6.5" r="5.5" stroke={color} strokeWidth="1.5" />
			<path d="M6.5 3.5V6.5L8.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

function IconCheck({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<circle cx="6.5" cy="6.5" r="5.5" stroke={color} strokeWidth="1.5" />
			<path d="M4 6.5L6 8.5L9.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

const FILTERS: { value: StatusFilter; label: string }[] = [
	{ value: "ALL", label: "Todos" },
	{ value: "LIVE", label: "Ao Vivo" },
	{ value: "SCHEDULED", label: "Agendados" },
	{ value: "CLOSED", label: "Encerrados" },
];

function formatCents(cents: string | null): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function formatTimeLeft(endsAt: string): { text: string; urgent: boolean } {
	const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
	if (diff === 0) return { text: "Encerrado", urgent: false };
	const days = Math.floor(diff / 86_400_000);
	const hours = Math.floor((diff % 86_400_000) / 3_600_000);
	const mins = Math.floor((diff % 3_600_000) / 60_000);
	const secs = Math.floor((diff % 60_000) / 1_000);
	if (days >= 2) return { text: `Faltam ${days} dias`, urgent: false };
	if (days === 1) return { text: "Falta 1 dia", urgent: false };
	if (hours >= 1) return { text: `Faltam ${hours}h ${mins}min`, urgent: false };
	if (mins >= 1) return { text: `Faltam ${mins}min`, urgent: true };
	return {
		text: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
		urgent: true,
	};
}

function useTimeLeft(endsAt: string): { text: string; urgent: boolean } {
	const [val, setVal] = useState(() => formatTimeLeft(endsAt));
	useEffect(() => {
		setVal(formatTimeLeft(endsAt));
		const id = setInterval(() => setVal(formatTimeLeft(endsAt)), 1_000);
		return () => clearInterval(id);
	}, [endsAt]);
	return val;
}


function LotImage({ src, alt }: { src: string | null; alt: string }) {
	const [failed, setFailed] = useState(false);
	if (!src || failed) {
		return (
			<div className="w-full h-full bg-[#F5F4F0] flex items-center justify-center p-4">
				<span className="text-[#9CA3AF] text-xs text-center line-clamp-3">
					{alt}
				</span>
			</div>
		);
	}
	return (
		<img
			src={src}
			alt={alt}
			onError={() => setFailed(true)}
			className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>
	);
}

function LiveBadge() {
	return (
		<span className="inline-flex items-center gap-1 bg-[#DC2626] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
			<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
			AO VIVO
		</span>
	);
}

function LotCard({ lot }: { lot: Lot }) {
	const timeLeft = useTimeLeft(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;
	const isLive = lot.status === "LIVE";

	return (
		<Link to={`/lots/${lot.id}`} className="group block">
			<div className="bg-white rounded-xl border border-[#E4E4E2] overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
				{/* Image 1:1 */}
				<div className="relative w-full" style={{ aspectRatio: "1/1" }}>
					<div className="absolute inset-0">
						<LotImage src={lot.imageUrl} alt={lot.title} />
					</div>
					{isLive && (
						<div className="absolute top-2 left-2 z-10">
							<LiveBadge />
						</div>
					)}
					{lot.status === "CLOSED" && (
						<div className="absolute inset-0 bg-black/20 flex items-end justify-start p-2">
							<span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-full">
								Encerrado
							</span>
						</div>
					)}
					{lot.status === "SCHEDULED" && (
						<div className="absolute top-2 left-2 z-10">
							<span className="text-[10px] font-semibold text-[#0D0D0D] bg-white/90 px-2 py-0.5 rounded-full">
								Agendado
							</span>
						</div>
					)}
					{lot.bidCount > 0 && (
						<div className="absolute bottom-2 right-2 z-10">
							<span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-full">
								{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"}
							</span>
						</div>
					)}
				</div>

				{/* Card body */}
				<div className="p-3">
					<p className="text-[11px] text-[#6B7280] mb-1 truncate">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2
						className="text-[15px] font-semibold leading-snug line-clamp-2 mb-3 text-[#0D0D0D]"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h2>

					<div className="border-t border-[#F0F0EE] pt-2.5 space-y-1.5">
						<div>
							<p className="text-[9px] text-[#9CA3AF] tracking-wider uppercase mb-0.5">
								Licitação atual
							</p>
							<p
								className="text-[19px] font-bold tabular-nums leading-none"
								style={{ color: "#1D4ED8" }}
							>
								{formatCents(bidCents)}
							</p>
						</div>
						<p
							className="text-xs font-medium"
							style={{ color: timeLeft.urgent ? "#DC2626" : "#6B7280" }}
						>
							{timeLeft.text}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
}

export function LotsPage() {
	const [filter, setFilter] = useState<StatusFilter>("ALL");

	const { data, isLoading, error } = useQuery({
		queryKey: ["lots"],
		queryFn: () => lots.list(),
		refetchInterval: 15_000,
	});

	const allLots = data?.items.filter((l) => l.status !== "CANCELLED") ?? [];
	const filtered =
		filter === "ALL" ? allLots : allLots.filter((l) => l.status === filter);

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			{/* Header */}
			<div className="mb-5">
				<h1
					className="text-3xl font-bold text-[#0D0D0D] mb-4"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Leilões
				</h1>

				{/* Filter chips */}
				<div className="flex items-center gap-2 flex-wrap">
					{FILTERS.map((f) => {
						const cnt =
							f.value === "ALL"
								? allLots.length
								: allLots.filter((l) => l.status === f.value).length;
						const active = filter === f.value;
						return (
							<button
								key={f.value}
								type="button"
								onClick={() => setFilter(f.value)}
								className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
								style={{
									background: active ? "#0D0D0D" : "#FFFFFF",
									color: active ? "#FFFFFF" : "#6B7280",
									border: active ? "1px solid #0D0D0D" : "1px solid #E4E4E2",
								}}
							>
								{f.value === "ALL" && (
									<IconGrid color={active ? "#fff" : "#6B7280"} />
								)}
								{f.value === "LIVE" && (
									<span
										className="w-2 h-2 rounded-full"
										style={{ background: active ? "#fff" : "#DC2626" }}
									/>
								)}
								{f.value === "SCHEDULED" && (
									<IconClock color={active ? "#fff" : "#6B7280"} />
								)}
								{f.value === "CLOSED" && (
									<IconCheck color={active ? "#fff" : "#6B7280"} />
								)}
								{f.label}
								<span className="text-xs tabular-nums opacity-60">{cnt}</span>
							</button>
						);
					})}
				</div>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center h-64 text-sm text-[#6B7280]">
					Carregando lotes…
				</div>
			)}

			{error && (
				<div className="flex items-center justify-center h-64 text-sm text-[#DC2626]">
					Falha ao carregar lotes.
				</div>
			)}

			{!isLoading && !error && filtered.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 text-sm text-[#6B7280]">
					Nenhum lote nesta categoria.
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{filtered.map((lot) => (
					<LotCard key={lot.id} lot={lot} />
				))}
			</div>
		</div>
	);
}
