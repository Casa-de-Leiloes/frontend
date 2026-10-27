import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots } from "@/lib/api";
import type { Lot } from "@/lib/api";

type StatusFilter = "ALL" | "LIVE" | "SCHEDULED" | "CLOSED";

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

function formatDiff(endsAt: string): string {
	const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
	if (diff === 0) return "Encerrado";
	const h = Math.floor(diff / 3_600_000);
	const m = Math.floor((diff % 3_600_000) / 60_000);
	const s = Math.floor((diff % 60_000) / 1_000);
	if (h >= 24) {
		return new Date(endsAt).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
		});
	}
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function useCountdown(endsAt: string): string {
	const [display, setDisplay] = useState(() => formatDiff(endsAt));
	useEffect(() => {
		setDisplay(formatDiff(endsAt));
		const id = setInterval(() => setDisplay(formatDiff(endsAt)), 1_000);
		return () => clearInterval(id);
	}, [endsAt]);
	return display;
}

function LiveDot() {
	return (
		<span
			className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse"
			style={{ background: "#fff" }}
		/>
	);
}

function StatusBadge({ status }: { status: string }) {
	const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";
	if (status === "LIVE")
		return (
			<span className={base} style={{ background: "#1d5fbf", color: "#fff" }}>
				<LiveDot />
				AO VIVO
			</span>
		);
	if (status === "SCHEDULED")
		return (
			<span className={base} style={{ background: "#e9e9e9", color: "#6b6b6b" }}>
				AGENDADO
			</span>
		);
	if (status === "CLOSED")
		return (
			<span className={base} style={{ background: "#f0f0f0", color: "#6b6b6b" }}>
				ENCERRADO
			</span>
		);
	if (status === "CANCELLED")
		return (
			<span className={base} style={{ background: "#ffedea", color: "#831c1e" }}>
				CANCELADO
			</span>
		);
	return (
		<span className={base} style={{ background: "#e9e9e9", color: "#6b6b6b" }}>
			{status}
		</span>
	);
}

function LotCard({ lot }: { lot: Lot }) {
	const countdown = useCountdown(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;

	return (
		<Link to={`/lots/${lot.id}`} className="group block">
			<div
				className="bg-white border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				style={{ borderColor: "#e6e6e6" }}
			>
				{/* Image */}
				<div
					className="relative w-full bg-[#f0f0f0]"
					style={{ aspectRatio: "4/3" }}
				>
					{lot.imageUrl ? (
						<img
							src={lot.imageUrl}
							alt={lot.title}
							className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
							loading="lazy"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<svg
								width="40"
								height="40"
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
					{/* Status badge overlay */}
					<div className="absolute top-2 left-2">
						<StatusBadge status={lot.status} />
					</div>
					{/* Bid count pill */}
					{lot.bidCount > 0 && (
						<div className="absolute bottom-2 right-2">
							<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm">
								{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"}
							</span>
						</div>
					)}
				</div>

				{/* Body */}
				<div className="p-4">
					<p className="text-[10px] text-[#9ca3af] mb-1 uppercase tracking-widest">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2 className="text-sm font-semibold text-[#0a0a0a] line-clamp-2 mb-3 leading-snug group-hover:text-[#1d5fbf] transition-colors">
						{lot.title}
					</h2>

					<div
						className="border-t pt-3 flex items-end justify-between gap-2"
						style={{ borderColor: "#f0f0f0" }}
					>
						<div>
							<p className="text-[10px] text-[#9ca3af] uppercase tracking-widest mb-0.5">
								Lance atual
							</p>
							<p
								className="text-2xl font-bold tabular-nums leading-none"
								style={{ color: "#1d5fbf" }}
							>
								{formatCents(bidCents)}
							</p>
						</div>
						<div className="text-right shrink-0">
							<p className="text-[10px] text-[#9ca3af] uppercase tracking-widest mb-0.5">
								{lot.status === "LIVE" ? "Encerra em" : "Encerra"}
							</p>
							<p className="text-sm font-mono font-medium text-[#0a0a0a] tabular-nums">
								{countdown}
							</p>
						</div>
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

	const liveCnt = allLots.filter((l) => l.status === "LIVE").length;

	return (
		<div className="max-w-7xl">
			{/* Header */}
			<div className="mb-6 flex items-baseline gap-3">
				<h1 className="text-xl font-bold text-[#0a0a0a]">Leilões</h1>
				{liveCnt > 0 && (
					<span
						className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
						style={{ background: "#1d5fbf", color: "#fff" }}
					>
						<LiveDot />
						{liveCnt} ao vivo
					</span>
				)}
			</div>

			{/* Filter tabs */}
			<div
				className="flex items-center gap-1 mb-6 border-b"
				style={{ borderColor: "#e6e6e6" }}
			>
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
							className="px-3 pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
							style={{
								borderBottomColor: active ? "#141414" : "transparent",
								color: active ? "#0a0a0a" : "#6b6b6b",
							}}
						>
							{f.label}
							<span
								className="ml-1.5 text-xs tabular-nums"
								style={{ color: active ? "#6b6b6b" : "#9ca3af" }}
							>
								{cnt}
							</span>
						</button>
					);
				})}
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="flex items-center justify-center h-64 text-sm text-[#6b6b6b]">
					Carregando lotes…
				</div>
			)}

			{/* Error */}
			{error && (
				<div className="flex items-center justify-center h-64 text-sm text-[#c4242a]">
					Falha ao carregar lotes.
				</div>
			)}

			{/* Empty */}
			{!isLoading && !error && filtered.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 text-sm text-[#6b6b6b]">
					Nenhum lote nesta categoria.
				</div>
			)}

			{/* Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{filtered.map((lot) => (
					<LotCard key={lot.id} lot={lot} />
				))}
			</div>
		</div>
	);
}
