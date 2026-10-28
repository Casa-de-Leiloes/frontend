import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { lots, imgProxy } from "@/lib/api";
import type { Lot } from "@/lib/api";

type StatusFilter = "ALL" | "LIVE" | "SCHEDULED" | "CLOSED";
type TimeFilter = "ENDS_TODAY" | "NONE";

function effectiveStatus(lot: Lot): "LIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED" {
	if (lot.status === "CANCELLED") return "CANCELLED";
	if (lot.status === "CLOSED") return "CLOSED";
	const now = Date.now();
	const endsAt = lot.endsAt ? new Date(lot.endsAt).getTime() : 0;
	const startsAt = lot.startsAt ? new Date(lot.startsAt).getTime() : 0;
	if (endsAt > 0 && endsAt <= now) return "CLOSED";
	if (lot.status === "LIVE" && startsAt <= now && endsAt > now) return "LIVE";
	return "SCHEDULED";
}

const LOT_CATEGORY_LABELS: Record<string, string> = {
	FINE_ART: "Arte",
	JEWELRY: "Joalharia",
	WATCHES: "Relógios",
	ANTIQUITIES: "Antiguidades",
	NUMISMATICS: "Numismática",
	FASHION: "Moda",
	VEHICLES: "Veículos",
	BOOKS: "Livros",
	WINE: "Vinhos",
	OTHER: "Outros",
};

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


function formatCents(cents: string | null): string {
	if (!cents) return "-";
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
	const proxied = imgProxy(src);
	if (!proxied || failed) {
		return (
			<div className="w-full h-full flex items-center justify-center p-4" style={{ background: "var(--ground)" }}>
				<span className="text-xs text-center line-clamp-3" style={{ color: "var(--ink-subtle)" }}>
					{alt}
				</span>
			</div>
		);
	}
	return (
		<img
			src={proxied}
			alt={alt}
			onError={() => setFailed(true)}
			className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>
	);
}

function LiveBadge() {
	return (
		<span className="inline-flex items-center gap-1 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--live)" }}>
			<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
			AO VIVO
		</span>
	);
}

function LotCard({ lot }: { lot: Lot }) {
	const timeLeft = useTimeLeft(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;
	const nowMs = Date.now();
	const startsAtMs = lot.startsAt ? new Date(lot.startsAt).getTime() : 0;
	const endsAtMs = lot.endsAt ? new Date(lot.endsAt).getTime() : 0;
	const diffMs = Math.max(0, endsAtMs - nowMs);
	const effStatus = effectiveStatus(lot);
	const isLive = effStatus === "LIVE" && startsAtMs <= nowMs && endsAtMs > nowMs && diffMs > 0;

	return (
		<Link to={`/lots/${lot.id}`} className="group block">
			<div
				className="rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
				style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
			>
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
					{effStatus === "CLOSED" && (
						<div className="absolute inset-0 bg-black/20 flex items-end justify-start p-2">
							<span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-full">
								Encerrado
							</span>
						</div>
					)}
					{effStatus === "SCHEDULED" && (
						<div className="absolute top-2 left-2 z-10">
							<span className="text-[10px] font-semibold bg-white/90 px-2 py-0.5 rounded-full" style={{ color: "#0D0D0D" }}>
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
					<p className="text-[11px] mb-1 truncate" style={{ color: "var(--ink-muted)" }}>
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2
						className="text-[15px] font-semibold leading-snug line-clamp-2 mb-3"
						style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
					>
						{lot.title}
					</h2>

					<div className="pt-2.5 space-y-1.5" style={{ borderTop: "1px solid var(--subtle-bg2)" }}>
						<div>
							<p className="text-[9px] tracking-wider uppercase mb-0.5" style={{ color: "var(--ink-subtle)" }}>
								Licitação atual
							</p>
							<p
								className="text-[19px] font-bold tabular-nums leading-none"
								style={{ color: "var(--accent)" }}
							>
								{formatCents(bidCents)}
							</p>
						</div>
						<p
							className="text-xs font-medium"
							style={{ color: timeLeft.urgent ? "var(--live)" : "var(--ink-muted)" }}
						>
							{timeLeft.text}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
}

function HeroLot({ lot }: { lot: Lot }) {
	const timeLeft = useTimeLeft(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;
	return (
		<Link to={`/lots/${lot.id}`} className="group block w-full">
			<div className="relative w-full rounded-2xl overflow-hidden bg-[#0D0D0D]" style={{ minHeight: 320 }}>
				{/* Background image */}
				{lot.imageUrl && (
					<img
						src={imgProxy(lot.imageUrl) ?? lot.imageUrl}
						alt={lot.title}
						className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
					/>
				)}
				{!lot.imageUrl && (
					<div className="absolute inset-0 bg-gradient-to-br from-[#1D4ED8]/30 to-[#0D0D0D]" />
				)}
				{/* Content overlay */}
				<div className="relative z-10 flex flex-col justify-end p-8 h-full" style={{ minHeight: 320 }}>
					<div className="mb-3">
						<LiveBadge />
					</div>
					<p className="text-white/60 text-xs tracking-wider uppercase mb-2">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2
						className="text-white text-3xl md:text-4xl font-bold leading-tight mb-4 max-w-2xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h2>
					<div className="flex items-end gap-6">
						<div>
							<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Licitação atual</p>
							<p className="text-white text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
								{formatCents(bidCents)}
							</p>
						</div>
						<div>
							<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Encerra</p>
							<p
								className="text-sm font-semibold"
								style={{ color: timeLeft.urgent ? "#FCA5A5" : "#D1D5DB" }}
							>
								{timeLeft.text}
							</p>
						</div>
						{lot.bidCount > 0 && (
							<div>
								<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Lances</p>
								<p className="text-sm font-semibold text-white/80">{lot.bidCount}</p>
							</div>
						)}
					</div>
					<div className="mt-5">
						<span className="inline-flex items-center bg-white text-[#0D0D0D] text-sm font-semibold px-5 py-2.5 rounded-full group-hover:bg-[#1D4ED8] group-hover:text-white transition-colors duration-200">
							Dar lance →
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

function SectionRow({
	title,
	icon,
	lots: sectionLots,
}: {
	title: string;
	icon: ReactNode;
	lots: Lot[];
}) {
	const scrollRef = useRef<HTMLDivElement>(null);

	function scroll(dir: "left" | "right") {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollBy({ left: dir === "right" ? 284 : -284, behavior: "smooth" });
	}

	if (sectionLots.length === 0) return null;
	return (
		<section className="mb-10 group/row">
			<div className="flex items-center justify-between mb-4">
				<h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--ink)" }}>
					{icon}
					{title}
					<span className="text-sm font-normal" style={{ color: "var(--ink-subtle)" }}>({sectionLots.length})</span>
				</h2>
			</div>
			<div className="relative">
				{/* Left arrow */}
				<button
					type="button"
					onClick={() => scroll("left")}
					aria-label="Anterior"
					className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
						w-9 h-9 rounded-full shadow-md
						flex items-center justify-center
						opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
					style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
						<path d="M15 18l-6-6 6-6"/>
					</svg>
				</button>

				{/* Right arrow */}
				<button
					type="button"
					onClick={() => scroll("right")}
					aria-label="Próximo"
					className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
						w-9 h-9 rounded-full shadow-md
						flex items-center justify-center
						opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
					style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
						<path d="M9 18l6-6-6-6"/>
					</svg>
				</button>

				<div
					ref={scrollRef}
					className="flex gap-4 overflow-x-auto pb-2"
					style={{ scrollbarWidth: "none" }}
				>
					{sectionLots.map((lot) => (
						<div key={lot.id} className="flex-none w-64">
							<LotCard lot={lot} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function LotCardSkeleton() {
	return (
		<div className="rounded-xl overflow-hidden animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
			<div className="w-full" style={{ aspectRatio: "1/1", background: "var(--subtle-bg2)" }} />
			<div className="p-3 space-y-2">
				<div className="h-2.5 rounded w-1/3" style={{ background: "var(--subtle-bg2)" }} />
				<div className="h-4 rounded w-3/4" style={{ background: "var(--subtle-bg2)" }} />
				<div className="h-3.5 rounded w-1/2 mt-1" style={{ background: "var(--subtle-bg2)" }} />
				<div className="pt-2.5 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
					<div className="h-2 rounded w-1/4" style={{ background: "var(--subtle-bg2)" }} />
					<div className="h-6 rounded w-2/5" style={{ background: "var(--subtle-bg2)" }} />
				</div>
			</div>
		</div>
	);
}

export function LotsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [timeFilter, setTimeFilter] = useState<TimeFilter>("NONE");
	const [query, setQuery] = useState("");

	// Derive filter from URL so nav tab links work
	const urlStatus = searchParams.get("status");
	const filter: StatusFilter =
		urlStatus === "LIVE" || urlStatus === "SCHEDULED" || urlStatus === "CLOSED"
			? urlStatus
			: "ALL";
	const setFilter = useCallback(
		(s: StatusFilter) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				if (s === "ALL") next.delete("status");
				else next.set("status", s);
				return next;
			});
		},
		[setSearchParams],
	);

	const urlCategory = searchParams.get("lotCategory") ?? undefined;

	const { data, isLoading, error } = useQuery({
		queryKey: ["lots", filter, timeFilter, urlCategory],
		queryFn: () => lots.list({
			status: filter !== "ALL" ? filter : undefined,
			endsToday: timeFilter === "ENDS_TODAY" ? true : undefined,
			lotCategory: urlCategory,
		}),
		refetchInterval: 15_000,
	});

	const allLots = data?.items.filter((l) => effectiveStatus(l) !== "CANCELLED") ?? [];
	const liveLots = allLots.filter((l) => effectiveStatus(l) === "LIVE");
	const scheduledLots = allLots.filter((l) => effectiveStatus(l) === "SCHEDULED");
	const closedLots = allLots.filter((l) => effectiveStatus(l) === "CLOSED");
	const heroLot = liveLots[0] ?? scheduledLots[0] ?? null;

	const q = query.trim().toLowerCase();
	const filtered = q
		? allLots.filter((l) => l.title.toLowerCase().includes(q))
		: allLots;

	const hasActiveFilter = filter !== "ALL" || timeFilter !== "NONE" || !!urlCategory || !!q;

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
				<div className="w-full h-48 rounded-2xl animate-pulse mb-10" style={{ background: "var(--subtle-bg2)" }} />
				<div className="flex gap-2 mb-8">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="h-8 w-24 rounded-full animate-pulse" style={{ background: "var(--subtle-bg2)" }} />
					))}
				</div>
				<div className="mb-4 h-5 w-32 rounded animate-pulse" style={{ background: "var(--subtle-bg2)" }} />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<LotCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64 text-sm" style={{ color: "var(--live)" }}>
				Falha ao carregar lotes.
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
			{/* Hero */}
			{heroLot && !hasActiveFilter && (
				<div className="mb-10">
					<HeroLot lot={heroLot} />
				</div>
			)}

			{/* Search */}
			<div className="relative mb-4 max-w-md">
				<svg
					className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
					width="16" height="16" viewBox="0 0 24 24" fill="none"
					stroke="var(--ink-subtle)" strokeWidth="2"
				>
					<circle cx="11" cy="11" r="8"/>
					<path d="m21 21-4.35-4.35"/>
				</svg>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar lotes..."
					className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2"
					style={{
						background: "var(--surface)",
						color: "var(--ink)",
						borderColor: "var(--border)",
						"--tw-ring-color": "var(--accent)",
					} as React.CSSProperties}
				/>
				{q && (
					<button
						type="button"
						onClick={() => setQuery("")}
						className="absolute right-3 top-1/2 -translate-y-1/2"
						style={{ color: "var(--ink-subtle)" }}
						aria-label="Limpar busca"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				)}
			</div>

			{/* Filter chips */}
			<div className="flex items-center gap-2 flex-wrap mb-8">
				{/* Todos */}
				{(() => {
					const active = filter === "ALL" && timeFilter === "NONE" && !urlCategory;
					return (
						<button
							type="button"
							onClick={() => { setFilter("ALL"); setTimeFilter("NONE"); setSearchParams({}); }}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "var(--ink)" : "var(--surface)",
								color: active ? "var(--ground)" : "var(--ink-muted)",
								border: active ? "1px solid var(--ink)" : "1px solid var(--border)",
							}}
						>
							<IconGrid color={active ? "var(--ground)" : "var(--ink-muted)"} />
							Todos
						</button>
					);
				})()}

				{/* Livestream (LIVE) */}
				{(() => {
					const active = filter === "LIVE";
					return (
						<button
							type="button"
							onClick={() => { setFilter(active ? "ALL" : "LIVE"); }}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "var(--live)" : "var(--surface)",
								color: active ? "#FFFFFF" : "var(--ink-muted)",
								border: active ? "1px solid var(--live)" : "1px solid var(--border)",
							}}
						>
							<span className="w-2 h-2 rounded-full" style={{ background: active ? "#fff" : "var(--live)" }} />
							Livestream
						</button>
					);
				})()}

				{/* Termina hoje */}
				{(() => {
					const active = timeFilter === "ENDS_TODAY";
					return (
						<button
							type="button"
							onClick={() => setTimeFilter(active ? "NONE" : "ENDS_TODAY")}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "var(--ink)" : "var(--surface)",
								color: active ? "var(--ground)" : "var(--ink-muted)",
								border: active ? "1px solid var(--ink)" : "1px solid var(--border)",
							}}
						>
							<IconClock color={active ? "var(--ground)" : "var(--ink-muted)"} />
							Termina hoje
						</button>
					);
				})()}

				{/* Começa em breve (SCHEDULED) */}
				{(() => {
					const active = filter === "SCHEDULED";
					return (
						<button
							type="button"
							onClick={() => setFilter(active ? "ALL" : "SCHEDULED")}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "var(--ink)" : "var(--surface)",
								color: active ? "var(--ground)" : "var(--ink-muted)",
								border: active ? "1px solid var(--ink)" : "1px solid var(--border)",
							}}
						>
							<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
								<circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
								<path d="M4 6.5h5M8 4l2 2.5-2 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
							</svg>
							Começa em breve
						</button>
					);
				})()}

				{/* Category tag (when active) */}
				{urlCategory && (
					<button
						type="button"
						onClick={() => setSearchParams({})}
						className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
						style={{ background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }}
					>
						{LOT_CATEGORY_LABELS[urlCategory] ?? urlCategory}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				)}

				{hasActiveFilter && (
					<span className="text-xs ml-2" style={{ color: "var(--ink-muted)" }}>
						{allLots.length} {allLots.length === 1 ? "leilão" : "leilões"}
					</span>
				)}
			</div>

			{/* Filtered view (any active filter) */}
			{hasActiveFilter ? (
				<>
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-sm" style={{ color: "var(--ink-muted)" }}>
							Nenhum lote encontrado.
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{filtered.map((lot) => (
								<LotCard key={lot.id} lot={lot} />
							))}
						</div>
					)}
				</>
			) : (
				/* ALL view: marketplace sections */
				<>
					<SectionRow
						title="Leilões ao vivo"
						icon={<span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--live)" }} />}
						lots={liveLots}
					/>
					<SectionRow
						title="Agendados"
						icon={<IconClock color="var(--ink-muted)" />}
						lots={scheduledLots}
					/>
					<SectionRow
						title="Encerrados"
						icon={<IconCheck color="var(--ink-muted)" />}
						lots={closedLots}
					/>
					{allLots.length === 0 && (
						<div className="flex flex-col items-center justify-center py-24 text-sm" style={{ color: "var(--ink-muted)" }}>
							Nenhum lote disponível no momento.
						</div>
					)}
				</>
			)}
		</div>
	);
}
